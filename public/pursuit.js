/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict'

let HOUR = 60 * 60 * 1000;
let DAY = 24 * HOUR;

class Objective {
  constructor({id, name, description, goals}) {
    this._id = id;
    this._name = name;
    this._description = description;
    this._goals = goals;
  }

  get id() {
    return this._id;
  }

  get name() {
    return this._name;
  }

  get description() {
    return this._description;
  }

  get goals() {
    return this._goals;
  }
}


class Goal {
  constructor({id = '',
               name = '',
               unit = '',
               target = 1.0,
               start = 0,
               end = 0,
               archived = false,
               trajectory = new Trajectory()}) {
    this._id = id;
    this._name = name;
    this._unit = unit;
    this._target = target;
    this._start = start;
    this._end = end;
    this._archived = archived;
    this._trajectory = trajectory;
  }

  get id() {
    return this._id;
  }

  get name() {
    return this._name;
  }

  get unit() {
    return this._unit;
  }

  get target() {
    return this._target;
  }

  get start() {
    return this._start;
  }

  get end() {
    return this._end;
  }

  get archived() {
    return this._archived;
  }

  get trajectory() {
    return this._trajectory;
  }

  get baseline() {
    return this.trajectory.at(this.start);
  }

  get progress() {
    if (!this.trajectory.length) {
      return NaN;
    }
    
    return (this.trajectory.latest.value - this.trajectory.at(this.start)) /
      (this.target - this.trajectory.at(this.start));
  }

  time_spent(by_date) {
    let total = this._end - this._start;
    let spent = by_date - this._start;
    return total == 0 ? 1.0 : spent / total;
  }

  days_left(by_date) {
    return Math.max(0, (this.end - by_date) / DAY);
  }

  is_on_track(by_date) {
    return this.progress >= this.time_spent(Math.min(this.end, by_date));
  }

  velocity(by_date) {
    return this.trajectory.velocity(this.start, by_date);
  }

  velocity_14d(by_date) {
    return this.trajectory.velocity(by_date - 14 * DAY, by_date);
  }

  velocity_30d(by_date) {
    return this.trajectory.velocity(by_date - 30 * DAY, by_date);
  }
}


class Trajectory {
  constructor() {
    this._line = [];
  }

  insert(date, value) {
    let p = this._line.length;
    while (p > 0 && this._line[p-1].date >= date) {
      --p;
		}
    this._line.splice(
      p,
      p < this._line.length && this._line[p].date == date ? 1 : 0,
			{date, value});
    return this;
  }

  at(date) {
    if (!this._line.length) {
      return undefined;
    }

    // extrapolate on the left
    if (this.earliest.date >= date) {
      return this.earliest.value;
    }

    // extrapolate on the right
    if (this.latest.date <= date) {
      return this.latest.value;
    }

    // interpolate
    let i0;
    for (i0 = 0; i0 < this._line.length - 1 && this._line[i0 + 1].date <= date; i0++) {}
    let i2 = i0 + 1;
    let t0 = this._line[i0].date;
    let t2 = this._line[i2].date;
    let m0 = this._line[i0].value;
    let m2 = this._line[i2].value;
    return m0 + (date - t0) * (m2 - m0) / (t2 - t0);
  }

  remove(date) {
    for (let i = 0; i < this._line.length; i++) {
      if (this._line[i].date == date) {
        this._line.splice(i, 1);
        return;
      }
		}
  }

  /**
   * Removes entries from the timeline that happened within an hour of the
   * latest entry. Never removes the earliest or latest entry from the
   * trajectory.
   *
   * Calling compact_head() after insertions into the trajectory helps reducing
   * the rate of changes recorded and ensures that transient states while the
   * user is editing the goal are discarded.
   */
  compact_head(duration = HOUR) {
    let head = this._line.pop();
    for (let i = this._line.length - 1;
         i > 0 && head.date - this._line[i].date <= DAY;
         i--) {
      this._line.pop(); 
    }
    this._line.splice(this._line.length, 0, head);
  }

  velocity(a, b) {
    return (this.at(b) - this.at(a)) / (b - a);
  }

  get earliest() {
    if (!this._line) {
      return NaN;
    }
    return this._line[0];
  }

  get latest() {
    if (!this._line) {
      return NaN;
    }
    return this._line[this._line.length - 1];
  }

  get length() {
    return this._line.length;
  }

  [Symbol.iterator]() {
    return this._line[Symbol.iterator]();
  }
};


class ObjectiveConverter {
  toFirestore(objective) {
    let goals = {};
    for (let g of objective.goals) {
      goals[g.id] = {
        id: g.id,
        name: g.name,
        unit: g.unit,
        start: g.start,
        end: g.end,
        target: g.target,
        archived: g.archived,
        trajectory: Array.from(g.trajectory),
      };
    }
    return {
      name: objective.name,
      description: objective.description,
      goals: goals,
    };
  }

  fromFirestore(snapshot, options) {
    const objective = snapshot.data(options);

    let goals = [];
    for (let id in objective.goals) {
      let g = objective.goals[id];
      let t = new Trajectory();
      if (g.trajectory) {
        for (let {date, value} of g.trajectory) {
          t.insert(date, value);
        }
      }
      goals.push(new Goal({
        id: id,
        name: g.name,
        unit: g.unit,
        start: g.start,
        end: g.end,
        target: g.target,
        archived: g.archived,
        trajectory: t,
      }));
    }

    return new Objective({
      id: snapshot.id,
      name: objective.name,
      description: objective.description,
      goals: goals,
    });
  }
}


class SafeMarkdownRenderer {
  render(markdown) {
    let rawHtml = marked(markdown);
    return sanitizeHtml(rawHtml, {
      allowedTags: [
        'a', 'p', 'code', 'em', 'strong', 'ul', 'ol', 'li',
      ],
      allowedAttributes: {
        'a': ['href'],
        'p': [],
        'code': [],
        'em': [],
        'strong': [],
        'ul': [],
        'ol': [],
        'li': [],
      },
      allowedSchemesByTag: {
        'a': [ 'http', 'https', ],
      },
    });
  }
}


class Model {
  constructor() {
    this._objectives = [];
    this._user_id = null;
    this._mode = 'view';
    this._show_archived = false;
  }

  get objectives() {
    return this._objectives;
  }

  set objectives(value) {
    this._objectives = value;
  }

  get user_id() {
    return this._user_id;
  }

  set user_id(value) {
    this._user_id = value;
  }

  get mode() {
    return this._mode;
  }

  set mode(mode) {
    this._mode = mode;
  }

  get show_archived() {
    return this._show_archived;
  }

  set show_archived(value) {
    this._show_archived = value;
  }
}


class Controller {
  set model(value) {
    this._model = value;
  }

  set view(value) {
    this._view = value;
  }

  signInWithGoogle() {
    let provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithRedirect(provider);
  }

  run() {
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        this._model.user_id = user.uid;
        this.listenToObjectives();
      }
    });
    this._view.render();
  }

  listenToObjectives() {
    firebase.firestore()
      .collection('users')
      .doc(this._model.user_id)
      .collection('objectives')
      .withConverter(new ObjectiveConverter())
      .onSnapshot((snapshot) => {
        let objectives = [];
        snapshot.forEach((d) => {
          objectives.push(d.data());
        });
        this._model.objectives = objectives;
        this._view.render();
      });
  }

  updateGoal(goalId, key, value) {
    let objectiveId = null;
    let goal = null;
    for (let o of this._model.objectives) {
      for (let g of o.goals) {
        if (g.id == goalId) {
          objectiveId = o.id;
          goal = g;
        }
      }
    }
    
    let update = null;
    if (key == 'baseline') {
      if (value == goal.baseline) {
        return;
      }
      goal.trajectory.insert(goal.start, value);
      update = {
        [`goals.${goalId}.trajectory`]: Array.from(goal.trajectory)
      };
    } else if (key == 'start') {
      if (value == goal.start) {
        return;
      }

      let baseline = goal.baseline;
      goal.trajectory.remove(goal.start);
      goal.trajectory.insert(value, baseline);
      update = {
        [`goals.${goalId}.start`]: value,
        [`goals.${goalId}.trajectory`]: Array.from(goal.trajectory)
      };
    } else {
      update = {
        [`goals.${goalId}.${key}`]: value
      };
    }

    firebase.firestore()
      .collection('users')
      .doc(this._model.user_id)
      .collection('objectives')
      .doc(objectiveId)
      .update(update);
  }

  updateTrajectory(goalId, value) {
    let objectiveId = null;
    let trajectory = null;
    for (let o of this._model.objectives) {
      for (let g of o.goals) {
        if (g.id == goalId) {
          objectiveId = o.id;
          if (g.trajectory.latest.value == value) {
            // This avoids updates when one of the input fields for progress
            // loses focus, but when the user did not change the value.
            return;
          }
          g.trajectory.insert(new Date().getTime(), value);
          g.trajectory.compact_head(HOUR);
          trajectory = Array.from(g.trajectory);
          break;
        }
      }
    }

    firebase.firestore()
      .collection('users')
      .doc(this._model.user_id)
      .collection('objectives')
      .doc(objectiveId)
      .update({
        [`goals.${goalId}.trajectory`]: trajectory,
      });
  }

  updateObjectiveName(objectiveId, name) {
    firebase.firestore()
      .collection('users')
      .doc(this._model.user_id)
      .collection('objectives')
      .doc(objectiveId)
      .update({name});
  }

  updateObjectiveDescription(objectiveId, description) {
    firebase.firestore()
      .collection('users')
      .doc(this._model.user_id)
      .collection('objectives')
      .doc(objectiveId)
      .update({description});
  }

  addObjective() {
    let objective = new Objective({
      id: uuidv4(),
      name: '',
      description: '',
      goals: [],
    });

    firebase.firestore()
      .collection('users')
      .doc(this._model.user_id)
      .collection('objectives')
      .doc(objective.id)
      .withConverter(new ObjectiveConverter())
      .set(objective);
  }

  addGoal(objectiveId) {
    let goalId = uuidv4();
    let now = new Date().getTime();
    firebase.firestore()
      .collection('users')
      .doc(this._model.user_id)
      .collection('objectives')
      .doc(objectiveId)
      .update({
        [`goals.${goalId}.name`]: '',
        [`goals.${goalId}.unit`]: '',
        [`goals.${goalId}.start`]: now,
        [`goals.${goalId}.end`]: now + 7 * DAY,
        [`goals.${goalId}.target`]: 100,
        [`goals.${goalId}.trajectory`]: [
          {date: now, value: 0},
        ],
      });
  }

  archiveGoal(goalId) {
    let objectiveId = null;
    for (let o of this._model.objectives) {
      for (let g of o.goals) {
        if (g.id == goalId) {
          objectiveId = o.id;
        }
      }
    }

    firebase.firestore()
      .collection('users')
      .doc(this._model.user_id)
      .collection('objectives')
      .doc(objectiveId)
      .update({
        [`goals.${goalId}.archived`]: true,
      });
  }

  unarchiveGoal(goalId) {
    let objectiveId = null;
    for (let o of this._model.objectives) {
      for (let g of o.goals) {
        if (g.id == goalId) {
          objectiveId = o.id;
        }
      }
    }

    firebase.firestore()
      .collection('users')
      .doc(this._model.user_id)
      .collection('objectives')
      .doc(objectiveId)
      .update({
        [`goals.${goalId}.archived`]: false,
      });
  }

  deleteGoal(goalId) {
    let objectiveId = null;
    for (let o of this._model.objectives) {
      for (let g of o.goals) {
        if (g.id == goalId) {
          objectiveId = o.id;
        }
      }
    }

    firebase.firestore()
      .collection('users')
      .doc(this._model.user_id)
      .collection('objectives')
      .doc(objectiveId)
      .update({
        [`goals.${goalId}`]: firebase.firestore.FieldValue.delete()
      });
  }

  deleteObjective(objectiveId) {
    firebase.firestore()
      .collection('users')
      .doc(this._model.user_id)
      .collection('objectives')
      .doc(objectiveId)
      .delete();
  }

  onView() {
    if (this._model.mode != 'view') {
      this._model.mode = 'view';
      this._view.render();
    }
  }

  onPlan() {
    if (this._model.mode != 'plan') {
      this._model.mode = 'plan';
      this._view.render();
    }
  }

  onTrack() {
    if (this._model.mode != 'track') {
      this._model.mode = 'track';
      this._view.render();
    }
  }
}


class App {
  constructor() {
    this._model = new Model();
    this._view = new View();
    this._controller = new Controller();

    // Bind
    this._view.model = this._model;
    this._view.controller = this._controller;
    this._controller.model = this._model;
    this._controller.view = this._view;
  }

  get model() {
    return this._model;
  }

  get view() {
    return this._view;
  }

  get controller() {
    return this._controller;
  }
}


class View {

  set model(value) {
    this._model = value;
  }

  set controller(value) {
    this._controller = value;
  }

  render() {
    if (this._model.user_id) {
      // Technically, this is not necessary as the sign in
      // will redirect.
      let signIn = document.querySelector('#signin');
      signIn.style.display = '';

      // Just clearing out everything leads to simpler code as we only need
      // to care about the enter selection in d3. Only when this becomes a
      // noticeable speed issue is it worthwhile to minimize DOM changes by
      // treating enter and update selections differently.
      document.querySelector('#app').innerHTML = '';

      let toolbar = d3.select('#app')
        .append('div')
        .attr('class', 'toolbar');

      let toolbarPrimary = toolbar.append('div');
      let toolbarSecondary = toolbar.append('div');

      toolbarPrimary
        .append('a')
        .text('View')
        .on('click', () => {
          this._controller.onView();
        });
      toolbarPrimary
        .append('a')
        .text('Plan')
        .on('click', () => {
          this._controller.onPlan();
        });
      toolbarPrimary
        .append('a')
        .text('Track')
        .on('click', () => {
          this._controller.onTrack();
        });

      if (this._model.mode == 'plan') {
        toolbarSecondary
          .append('a')
          .text('+Objective')
          .on('click', () => {
            this._controller.addObjective();
          });
      }

      if (this._model.mode != 'plan') {
        toolbarSecondary
          .append('a')
          .text((this._model.show_archived ? 'Hide' : 'Show') + ' archived')
          .on('click', () => {
            this._model.show_archived = !this._model.show_archived;
            this.render();
          });
      }

      d3.select('#app')
        .style('display', 'flex')
        .selectAll('div.objective')
        .data(this._model.objectives)
        .enter()
        .append('div')
        .attr('class', 'objective')
        .call((n) => this._renderObjective(n));
    } else {
      this._renderSignIn();
    }
  }

  _renderObjective(node) {
    if (this._model.mode == 'plan') {
      node.append('div')
        .attr('class', 'objective-name')
        .append('input')
        .attr('placeholder', 'Name the objective here...')
        .attr('value', (o) => o.name)
        .on('change', (o) => {
          this._controller.updateObjectiveName(o.id, d3.event.target.value);
        });
    } else {
      node.append('div')
        .attr('class', 'objective-name')
        .text((o) => o.name);
    }

    if (this._model.mode == 'plan') {
      node.append('div')
    	  .attr('class', 'objective-description')
        .append('textarea')
        .attr('placeholder', 'Describe the objective here...')
        .text((o) => o.description)
        .on('change', (o) => {
          this._controller.updateObjectiveDescription(o.id, d3.event.target.value);
        });

      let objectiveToolbar = node.append('div')
        .attr('class', 'toolbar');
      objectiveToolbar
        .append('a')
        .text('+Goal')
        .on('click', (o) => {
          this._controller.addGoal(o.id);
        });
      objectiveToolbar
        .append('a')
        .text('Delete')
        .on('click', (o) => {
          if (confirm(`Really delete the objective named "${o.name}"?`)) {
            this._controller.deleteObjective(o.id);
          }
        });
    }
    
    if (this._model.mode == 'view') {
      let markdown = new SafeMarkdownRenderer();
      node.append('div')
    	  .attr('class', 'objective-description')
        .html((o) => markdown.render(o.description ?? ''));
    }

	  let byName = (a, b) => (
      a.name > b.name ? 1 : a.name < b.name ? -1 : 0
    );
    let byStatus = (g) => this._model.mode == 'plan' || this._model.show_archived || !g.archived;
    node.selectAll('div.goal')
      .data((o) => o.goals.filter(byStatus).sort(byName))
      .enter()
      .append('div')
      .attr('class', 'goal')
      .call((n) => this._renderGoal(n));
  }

  _bound(number, min, max) {
    return Math.max(Math.min(number, max), min);
  }

  _renderGoal(node) {
    // Draw names
    if (this._model.mode == 'plan') {
      node.append('div')
        .attr('class', 'name')
        .append('input')
        .attr('placeholder', 'Name the goal here...')
        .attr('value', (g) => g.name)
        .on('change', (g) => {
          this._controller.updateGoal(g.id, 'name', d3.event.target.value);
        });
    } else {
		  node.append('div')
        .attr('class', 'name')
        .text((g) => g.name + (g.archived ? ' [archived]' : ''));
    }

    let svg =
      node.append('svg')
        .attr('class', 'chart')
        .attr('viewBox', `0 0 100% 65`);

    // Draw progress
    let now = new Date().getTime();
    let v_14d = (g) => (DAY * g.velocity_14d(now)).toFixed(1);
    let v_30d = (g) => (DAY * g.velocity_30d(now)).toFixed(1);
    let v_all = (g) => (DAY * g.velocity(now)).toFixed(1);
		svg.append('text')
      .attr('class', 'progress')
      .attr('text-anchor', 'middle')
      .attr('x', '50%')
      .attr('y', 60)
      .text((g) => {
        return `@ ${(100 * g.progress).toFixed(1)}% `
        + `(${v_14d(g)} | ${v_30d(g)} | ${v_all(g)} ${g.unit}/d)`
      });

    // Draw time left
		svg.append('text')
      .attr('class', 'days-left')
      .attr('text-anchor', 'middle')
      .attr('x', '50%')
      .attr('y', 20)
      .text((g) => `${g.days_left(now).toFixed(0)} days left`);

    // Draw progress bar wires
    svg.append('rect')
      .attr('width', '100%')
      .attr('height', 6)
      .attr('fill', 'lightgrey')
      .attr('y', 32);

   // Draw progress bars
   svg.append('rect')
     .attr('width', (g) => `${100 * this._bound(g.progress, 0, 1)}%`)
     .attr('height', 18)
     .attr('class', (g) => (g.is_on_track(now)
                              ? 'current ontrack'
                              : 'current offtrack'))
     .attr('y', 26);

   // Draw current date
   svg.append('rect')
     .attr('class', 'today')
     .attr('width', '0.5%')
     .attr('height', 26)
     .attr('x', (g) => `${100 * g.time_spent(now) - 0.25}%`)
     .attr('y', 22);

   // Draw start as text
   svg.append('text')
     .attr('class', 'start')
     .attr('text-anchor', 'start')
     .attr('x', 0)
     .attr('y', 20)
     .text((g) => `${new Date(g.start).toISOString().slice(0, 10)}`);

   // Draw end as text
   svg.append('text')
     .attr('class', 'end')
     .attr('text-anchor', 'end')
     .attr('x', '100%')
     .attr('y', 18)
     .text((g) => `${new Date(g.end).toISOString().slice(0, 10)}`);

   // Draw baseline as text
   svg.append('text')
     .attr('class', 'baseline')
     .attr('text-anchor', 'start')
     .attr('x', 0)
     .attr('y', 60)
     .text((g) => `${g.baseline}`)

   // Draw target/unit as text
   svg.append('text')
     .attr('class', 'target')
     .attr('text-anchor', 'end')
     .attr('x', '100%')
     .attr('y', 60)
     .text((g) => `${g.target} ${g.unit}`);

    if (this._model.mode == 'plan' || this._model.mode == 'track') {
      let form =
        node.append('div')
          .attr('class', 'edit');
      let add_field = (name, type, getter, setter, detail) => {
        let field = form.append('div');
        field.append('div')
          .text(name);
        field.append('input')
          .attr('type', type)
          .attr('placeholder', `Enter ${type}`)
          .attr('value', getter)
          .on('focusout', (g) => {
            setter(g, d3.event.target.value);
          });
        if (detail) {
          field.append('div')
            .text(detail);
        }
      };

      if (this._model.mode == 'plan') {
        add_field(
          'Unit',
          'text',
          (g) => g.unit,
          (g, v) => this._controller.updateGoal(g.id, 'unit', v));
        add_field(
          'Start',
          'number',
          (g) => g.start,
          (g, v) => this._controller.updateGoal(g.id, 'start', parseFloat(v)));
        add_field(
          'Baseline',
          'number',
          (g) => g.baseline,
          (g, v) => this._controller.updateGoal(g.id, 'baseline', parseFloat(v)));
        add_field(
          'End',
          'number',
          (g) => g.end,
          (g, v) => this._controller.updateGoal(g.id, 'end', parseFloat(v)));
        add_field(
          'Target',
          'number',
          (g) => g.target,
          (g, v) => this._controller.updateGoal(g.id, 'target', parseFloat(v)));
 
        let toolbar = form.append('div')
          .attr('class', 'toolbar');
        toolbar
          .append('a')
          .text('Delete')
          .on('click', (g) => {
            if (confirm(`Really delete the goal named "${g.name}"?`)) {
              this._controller.deleteGoal(g.id);
            }
          });
        toolbar
          .append('a')
          .text((g) => g.archived ? 'Unarchive' : 'Archive')
          .on('click', (g) => {
              this._controller.archiveGoal(g.id);
          });
      }

      if (this._model.mode == 'track') {
        add_field(
          'Current',
          'number',
          (g) => g.trajectory.latest.value,
          (g, v) => {
            let value = parseFloat(v);
            this._controller.updateTrajectory(g.id, value);
          },
          (g) => `last updated on ${new Date(g.trajectory.latest.date).toLocaleString()}`);
      }
    }
  }

  _renderSignIn() {
    let signIn = document.querySelector('#signin');
    signIn.style.display = 'block';
    let signInLink = document.createElement('a');
    signInLink.href = '#';
    signInLink.innerText = 'Sign in with Google';
    signInLink.onclick = () => this._controller.signInWithGoogle();
    signIn.appendChild(signInLink);
  }
}
