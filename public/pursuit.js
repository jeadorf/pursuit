'use strict'

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
  constructor({id,
               name,
               unit = '',
               target = 1.0,
               baseline = 0.0,
               current = null,
               start = 0,
               end = 0}) {
    this._id = id;
    this._name = name;
    this._unit = unit;
    this._target = target;
    this._baseline = baseline;
    this._current = current ?? baseline;
    this._start = start;
    this._end = end;
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

  get baseline() {
    return this._baseline;
  }

  get current() {
    return this._current;
  }

  set current(value) {
    return this._current = value;
  }

  get start() {
    return this._start;
  }

  get end() {
    return this._end;
  }

  get progress() {
    return (this._current - this._baseline) / (this._target - this._baseline);
  }

  time_spent(by_date) {
    let total = this._end - this._start;
    let spent = by_date - this._start;
    return total == 0 ? 1.0 : spent / total;
  }

  days_left(by_date) {
    let day = 24 * 60 * 60 * 1000;
    return (this.end - by_date) / day;
  }

  is_on_track(by_date) {
    return this.progress >= this.time_spent(by_date);
  }
}


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
        baseline: g.baseline,
        target: g.target,
        current: g.current,
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
      goals.push(new Goal({
        id: id,
        name: g.name,
        unit: g.unit,
        start: g.start,
        end: g.end,
        baseline: g.baseline,
        target: g.target,
        current: g.current,
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
        'a', 'p', 'code', 'em', 'strong'
      ],
      allowedAttributes: {
        'a': ['href'],
        'p': [],
        'code': [],
        'em': [],
        'strong': [],
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

  updateGoal(goalId, current) {
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
        [`goals.${goalId}.current`]: current
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

  onEdit(edit) {
    if (this._model.edit != edit) {
      this._model.edit = edit;
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
          this._controller.onEdit(false);
        });
      toolbarPrimary
        .append('a')
        .text('Edit')
        .on('click', () => {
          this._controller.onEdit(true);
        });

      if (this._model.edit) {
        toolbarSecondary
          .append('a')
          .text('+Objective')
          .on('click', () => {
            this._controller.addObjective();
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
    if (this._model.edit) {
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

    if (this._model.edit) {
      node.append('div')
    	  .attr('class', 'objective-description')
        .append('textarea')
        .attr('placeholder', 'Describe the objective here...')
        .text((o) => o.description)
        .on('change', (o) => {
          this._controller.updateObjectiveDescription(o.id, d3.event.target.value);
        });
    } else {
      let markdown = new SafeMarkdownRenderer();
      node.append('div')
    	  .attr('class', 'objective-description')
        .html((o) => markdown.render(o.description ?? ''));
    }
 
	  let byName = (a, b) => (
      a.name > b.name ? 1 : a.name < b.name ? -1 : 0
    );
    node.selectAll('div.goal')
      .data((o) => o.goals.sort(byName))
      .enter()
      .append('div')
      .attr('class', 'goal')
      .call((n) => this._renderGoal(n));
  }

  _renderGoal(node) {
    let svg =
      node.append('svg')
        .attr('class', 'chart')
        .attr('viewBox', `0 0 100% 85`);

    // Draw names
		svg.append('text')
      .attr('class', 'name')
      .attr('x', 0)
      .attr('y', 20)
      .text((g) => g.name);

    // Draw progress
		svg.append('text')
      .attr('class', 'progress')
      .attr('text-anchor', 'middle')
      .attr('x', '50%')
      .attr('y', 80)
      .text((g) => `${(100 * g.progress).toFixed(1)}% complete`);

    // Draw time left
    let now = new Date().getTime();
		svg.append('text')
      .attr('class', 'days-left')
      .attr('text-anchor', 'middle')
      .attr('x', '50%')
      .attr('y', 40)
      .text((g) => `${g.days_left(now).toFixed(0)} days left`);

    // Draw progress bar wires
    svg.append('rect')
      .attr('width', '100%')
      .attr('height', 6)
      .attr('fill', 'lightgrey')
      .attr('y', 52);

   // Draw progress bars
   svg.append('rect')
     .attr('width', (g) => `${100 * g.progress}%`)
     .attr('height', 18)
     .attr('class', (g) => (g.is_on_track(now)
                              ? 'current ontrack'
                              : 'current offtrack'))
     .attr('y', 46);

   // Draw current date
   svg.append('rect')
     .attr('class', 'today')
     .attr('width', '0.5%')
     .attr('height', 26)
     .attr('x', (g) => `${100 * g.time_spent(now) - 0.25}%`)
     .attr('y', 42);

   // Draw start as text
   svg.append('text')
     .attr('class', 'start')
     .attr('text-anchor', 'start')
     .attr('x', 0)
     .attr('y', 40)
     .text((g) => `${new Date(g.start).toISOString().slice(0, 10)}`);

   // Draw end as text
   svg.append('text')
     .attr('class', 'end')
     .attr('text-anchor', 'end')
     .attr('x', '100%')
     .attr('y', 38)
     .text((g) => `${new Date(g.end).toISOString().slice(0, 10)}`);

   // Draw baseline as text
   svg.append('text')
     .attr('class', 'baseline')
     .attr('text-anchor', 'start')
     .attr('x', 0)
     .attr('y', 80)
     .text((g) => `${g.baseline}`)

   // Draw target/unit as text
   svg.append('text')
     .attr('class', 'target')
     .attr('text-anchor', 'end')
     .attr('x', '100%')
     .attr('y', 80)
     .text((g) => `${g.target} ${g.unit}`);

    if (this._model.edit) {
      let edit =
        node.append('div')
          .attr('class', 'edit');
      let add_field = (form, name, getter) => {
        let field = form.append('div');
        field.append('div')
          .text(name);
        field.append('input')
          .attr('value', getter)
          .on('change', (g) => {
            this._controller.updateGoal(g.id, d3.event.target.value);
          });
      };
      // add_field(edit, 'Name', (g) => g.name);
      // add_field(edit, 'Unit', (g) => g.unit);
      // add_field(edit, 'Start', (g) => g.start);
      // add_field(edit, 'End', (g) => g.end);
      add_field(edit, 'Current', (g) => g.current);
      // add_field(edit, 'Baseline', (g) => g.baseline);
      // add_field(edit, 'Target', (g) => g.target);
    }
  }

  _renderSignIn() {
    let signIn = document.querySelector('#signin');
    signIn.style.display = 'block';
    let signInLink = document.createElement('a');
    signInLink.href = '#';
    signInLink.innerText = 'Sign in with Google';
    signInLink.onclick = () => this.signInWithGoogle();
    signIn.appendChild(signInLink);
  } 
}
