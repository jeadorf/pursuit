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
  constructor({id, name, description, goals, regular_goals}) {
    this._id = id;
    this._name = name;
    this._description = description;
    this._goals = goals;
    this._regular_goals = regular_goals;
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

  get regular_goals() {
    return this._regular_goals;
  }

  set goals(goals) {
    this._goals = goals;
  }

  set regular_goals(regular_goals) {
    this._regular_goals = regular_goals;
  }
}

const Stage = {
  DRAFT: 'draft',
  PLEDGED: 'pledged',
  ARCHIVED: 'archived',
};

class Goal {

  constructor({id = '',
               name = '',
               unit = '',
               target = 1.0,
               start = 0,
               end = 0,
               stage = Stage.PLEDGED,
               trajectory = new Trajectory()}) {
    this._id = id;
    this._name = name;
    this._unit = unit;
    this._target = target;
    this._start = start;
    this._end = end;
    this._stage = stage;
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

  get stage() {
    return this._stage;
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
    
    return (
      (this.trajectory.latest.value - this.baseline) /
      (this.target - this.baseline));
  }

  time_spent(by_date) {
    let total = this._end - this._start;
    let spent = by_date - this._start;
    return total == 0 ? 1.0 : spent / total;
  }

  days_until_start(by_date) {
    return (this.start - by_date) / DAY;
  }

  days_until_end(by_date) {
    return (this.end - by_date) / DAY;
  }

  relative_progress(by_date) {
    if (by_date <= this.start) { return 1.0; }
    let p = this.trajectory.at(by_date) / (this.target - this.baseline);
    let t = this.time_spent(Math.min(this.end, by_date));
    return p / t;
  }

  is_on_track(by_date) {
    return this.progress >= this.time_spent(Math.min(this.end, by_date));
  }

  velocity(by_date) {
    return this.trajectory.velocity(this.start, by_date);
  }

  velocity_30d(by_date) {
    return this.trajectory.velocity(Math.max(this.start, by_date - 30 * DAY), by_date);
  }
  
  velocity_required(by_date) {
    return (this.target - this.trajectory.at(by_date)) / (this.end - by_date);
  }
}


class RegularGoal {

  constructor({id = '',
               name = '',
               description = '',
               unit = '',
               window = 28,
               target = 0.0,
               total = 0.0,
               trajectory = new Trajectory()}) {
    this._id = id;
    this._name = name;
    this._description = description,
    this._unit = unit,
    this._window = window;
    this._target = target;
    this._total = total;
    this._trajectory = trajectory;
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

  get unit() {
    return this._unit;
  }

  get window() {
    return this._window;
  }

  get target() {
    return this._target;
  }

  get total() {
    return this._total;
  }

  get trajectory() {
    return this._trajectory;
  }

  value(by_date) {
    return (this.trajectory.at(by_date) - this.trajectory.at(by_date - this.window * DAY));
  }

  budget_remaining(by_date) {
    let actual = this.value(by_date) / this.total;
    return (actual - this.target) / (1.0 - this.target);
  }

  budget_remaining_adjusted(by_date) {
    if (this.partial_data(by_date)) {
      let adjusted_total = 1.0 * Math.max(DAY, by_date - this.trajectory.earliest.date) / (this.window * DAY) * this.total;
      let actual = this.value(by_date) / adjusted_total;
      return Math.max(0.0, Math.min(1.0, (actual - this.target) / (1.0 - this.target)));
    }
    return this.budget_remaining(by_date);
  }

  partial_data(by_date) {
    return this.trajectory.earliest.date > (by_date - this.window * DAY);
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
        stage: g.stage,
        trajectory: Array.from(g.trajectory),
      };
    }
    let regular_goals = {};
    for (let g of objective.regular_goals) {
      regular_goals[g.id] = {
        id: g.id,
        name: g.name,
        description: g.description,
        unit: g.unit,
        window: g.window,
        target: g.target,
        total: g.total,
        trajectory: Array.from(g.trajectory),
      };
    }
    return {
      name: objective.name,
      description: objective.description,
      goals: goals,
      regular_goals: regular_goals,
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
        stage: g.stage,
        trajectory: t,
      }));
    }

    let regular_goals = [];
    for (let id in objective.regular_goals) {
      let g = objective.regular_goals[id];
      let t = new Trajectory();
      if (g.trajectory) {
        for (let {date, value} of g.trajectory) {
          t.insert(date, value);
        }
      }
      regular_goals.push(new RegularGoal({
        id: id,
        name: g.name,
        description: g.description,
        unit: g.unit,
        window: g.window,
        target: g.target,
        total: g.total,
        trajectory: t,
      }));
    }

    return new Objective({
      id: snapshot.id,
      name: objective.name,
      description: objective.description,
      goals: goals,
      regular_goals: regular_goals,
    });
  }
}


class SafeMarkdownRenderer {
  render(markdown) {
    if (!markdown) {
      return '';
    }
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

class VelocityReport {
  report(goal, by_date) {
    let v = goal.velocity_30d(by_date) * DAY;
    let rv = goal.velocity_required(by_date) * DAY;
    let round = (f) => f.toFixed(1);
    // Attempt to choose a time period where there was at least one unit of
    // progress. There are alternative ways of choosing a sensible period of
    // time, e.g. based on the rate (target - baseline) / (end - start).
    if (v >= 1 || rv >= 1) {
      return `30d: ${round(v)} ${goal.unit} per day; now need ${round(rv)} ${goal.unit} per day`;
    } else if (v * 7 >= 1 || rv * 7 >= 1) {
      return `30d: ${round(v * 7)} ${goal.unit} per week; now need ${round(rv * 7)} ${goal.unit} per week`;
    } else {
      return `30d: ${round(v * 30)} ${goal.unit} per month; now need ${round(rv * 30)} ${goal.unit} per month`;
    }
  }
}

class ProgressReport {
  progressFillColor(goal, by_date) {
    let s = 0.8;
    let w = (goal.relative_progress(by_date) - s) / (1.0 - s);
    w = Math.min(1.0, w);
    w = Math.max(0.0, w);
    let r = (1.0 - w) * 187 + w * 136;
    let g = (1.0 - w) * 102 + w * 187;
    let b = 77;
    return `rgb(${r},${g},${b})`;
  }

  progressStatus(goal, by_date) {
    let days_until_start = goal.days_until_start(by_date);
    let days_until_end = goal.days_until_end(by_date);
    if (by_date < goal.start) {
        return `${days_until_start.toFixed(0)} days until start, nothing to do`;
    } else if (goal.progress >= 1.0) {
        if (by_date < goal.end) {
        return 'complete, ahead';
        } else {
        return 'complete';
        }
    } else {
        if (by_date >= goal.end) {
            return 'incomplete';
        } else {
            if (goal.is_on_track(by_date)) {
                return `${days_until_end.toFixed(0)} days left, on track @ ${(100 * goal.progress).toFixed(1)}%`;
            } else {
                return `${days_until_end.toFixed(0)} days left, behind @ ${(100 * goal.progress).toFixed(1)}%`;
            }
        }
    }
  }
}

// Mode represents different UI: viewing, tracking, or planning.
//
// @enum {string}
const Mode = {
  // VIEW is a "read-only" mode. When viewing, the user can see their
  // objectives and goals, and thus see progress. However, the user cannot
  // change objectives or goals. This prevents accidental changes, and avoids
  // distracting elements.
  VIEW: 'view',
  // TRACK is a mode which allows the user to conveniently update the progress
  // for their goals. Still, this mode only provides the minimum surface for
  // updating progress, avoiding other distracting elements, and preventing
  // accidental changes.
  TRACK: 'track',
  // PLAN is a mode which gives the user full control (CRUD) over objectives
  // and goals.
  PLAN: 'plan',
};

// modeMixin provides common functionality to both the <goal> and the
// <regular-goal> Vue components.
let modeMixin = {
  computed: {
    viewing: function() {
      return this.mode == Mode.VIEW;
    },
    tracking: function() {
      return this.mode == Mode.TRACK;
    },
    planning: function() {
      return this.mode == Mode.PLAN;
    },
  },
};

// Registers the <objective> Vue component globally. This component renders an
// objective and its goals.
Vue.component('objective', {
  mixins: [modeMixin],
  props: ['objective', 'mode', 'user_id'],
  computed: {
    descriptionHtml: function() {
      let markdown = new SafeMarkdownRenderer();
      return markdown.render(this.objective.description);
    },
  },
  methods: {
    // updateObjective makes changes to the objective in Firestore.
    updateObjective: function(update) {
      firebase.firestore()
        .collection('users')
        .doc(this.user_id)
        .collection('objectives')
        .doc(this.objective.id)
        .update(update);
    },

    // createGoal adds a new goal to the objective in Firestore.
    createGoal: function() {
      let goalId = uuidv4();
      let now = new Date().getTime();
      this.updateObjective({
        [`goals.${goalId}.name`]: 'AA New goal',
        [`goals.${goalId}.unit`]: '',
        [`goals.${goalId}.start`]: now,
        [`goals.${goalId}.end`]: now + 7 * DAY,
        [`goals.${goalId}.target`]: 100,
        [`goals.${goalId}.stage`]: Stage.PLEDGED,
        [`goals.${goalId}.trajectory`]: [
          {date: now, value: 0},
        ],
      });
    },

    // createRegularGoal adds a new regular goal to the objective in Firestore.
    createRegularGoal: function() {
      let goalId = uuidv4();
      let now = new Date().getTime();
      this.updateObjective({
          [`regular_goals.${goalId}.name`]: 'AA New regular goal',
          [`regular_goals.${goalId}.description`]: '',
          [`regular_goals.${goalId}.unit`]: '',
          [`regular_goals.${goalId}.total`]: 100,
          [`regular_goals.${goalId}.target`]: 0.9,
          [`regular_goals.${goalId}.window`]: 28,
          [`regular_goals.${goalId}.trajectory`]: [
            {date: now, value: 0},
          ],
        });
    },

    // copyObjectiveIdToClipboard puts the objective ID into the clipboard.
    copyObjectiveIdToClipboard: function() {
      navigator.clipboard.writeText(this.objective.id);
    },

    // incrementGoal increments the latest value of a goal by one.
    incrementGoal(goal) {
      let t = _.cloneDeep(goal.trajectory);
      t.insert(new Date().getTime(), t.latest.value + 1);
      t.compact_head(HOUR);

      this.updateObjective({
        [`goals.${goal.id}.trajectory`]: Array.from(t),
      });
    },

    // decrementGoal decrements the latest value of a goal by one.
    decrementGoal(goal) {
      let t = _.cloneDeep(goal.trajectory);
      t.insert(new Date().getTime(), t.latest.value - 1);
      t.compact_head(HOUR);

      this.updateObjective({
        [`goals.${goal.id}.trajectory`]: Array.from(t),
      });
    },

    // updateGoalName renames the goal.
    updateGoalName(goal, name) {
      this.updateObjective({
        [`goals.${goal.id}.name`]: name,
      });
    },

    // updateGoalStart changes the start date of the goal. It is not obvious
    // what to do if the trajectory already contains point past the previous
    // start date. Users should not change the start date for any goals after
    // they already made progress on these goals.  If users still want to
    // change the start date, they will have to reset the trajectory.  Smarter
    // implementations are possible.
    updateGoalStart(goal, start) {
      if (!confirm(`Changing the baseline will delete the trajectory of "${goal.name}", proceed?`)) {
        return;
      }
      let t = new Trajectory();
      t.insert(goal.start, goal.baseline);
      this.updateObjective({
        [`goals.${goal.id}.start`]: start,
        [`goals.${goal.id}.trajectory`]: Array.from(t),
      });
    },

    // updateGoalStart changes the end date of the goal.
    updateGoalEnd(goal, end) {
      this.updateObjective({
        [`goals.${goal.id}.end`]: end,
      });
    },

    // updateGoalBaseline changes the end date of the goal.
    updateGoalBaseline(goal, baseline) {
      if (!confirm(`Changing the baseline will delete trajectory of "${goal.name}", proceed?`)) {
        return;
      }
      let t = new Trajectory();
      t.insert(goal.start, baseline);
      this.updateObjective({
        [`goals.${goal.id}.start`]: goal.start,
        [`goals.${goal.id}.trajectory`]: Array.from(t),
      });
    },

    // updateGoalTarget changes the target of the goal.
    updateGoalTarget(goal, target) {
      this.updateObjective({
        [`goals.${goal.id}.target`]: target,
      });
    },

    // updateGoalCurrent changes the latest value of the goal.
    updateGoalCurrent(goal, current) {
      let t = _.cloneDeep(goal.trajectory);
      t.insert(new Date().getTime(), current);
      t.compact_head(HOUR);

      this.updateObjective({
        [`goals.${goal.id}.trajectory`]: Array.from(t),
      });
    },

    // updateGoalUnit changes the unit of the goal.
    updateGoalUnit(goal, unit) {
      this.updateObjective({
        [`goals.${goal.id}.unit`]: unit,
      });
    },

    // deleteGoal removes the goal from its objective.
    deleteGoal: function(goal) {
      if (confirm(`Really delete the goal "${goal.name}"?`)) {
        this.updateObjective({
          [`goals.${goal.id}`]: firebase.firestore.FieldValue.delete()
        });
      }
    },

    // incrementRegularGoal increments the latest value of a regular goal by
    // one.
    incrementRegularGoal(goal) {
      let t = _.cloneDeep(goal.trajectory);
      t.insert(new Date().getTime(), t.latest.value + 1);
      t.compact_head(HOUR);

      this.updateObjective({
        [`regular_goals.${goal.id}.trajectory`]: Array.from(t),
      });
    },

    // decrementRegularGoal decrements the latest value of a regular goal by
    // one.
    decrementRegularGoal(goal) {
      let t = _.cloneDeep(goal.trajectory);
      t.insert(new Date().getTime(), t.latest.value - 1);
      t.compact_head(HOUR);

      this.updateObjective({
        [`regular_goals.${goal.id}.trajectory`]: Array.from(t),
      });
    },

    // updateRegularGoalName renames a regular goal.
    updateRegularGoalName(goal, name) {
      this.updateObjective({
        [`regular_goals.${goal.id}.name`]: name,
      });
    },

    // updateRegularGoalDescription changes the description of a regular goal.
    updateRegularGoalDescription(goal, description) {
      this.updateObjective({
        [`regular_goals.${goal.id}.description`]: description,
      });
    },

    // updateRegularGoalWindow changes the window of a regular goal.
    updateRegularGoalWindow(goal, window) {
      this.updateObjective({
        [`regular_goals.${goal.id}.window`]: window,
      });
    },

    // updateRegularGoalTarget changes the target of a regular goal.
    updateRegularGoalTarget(goal, target) {
      this.updateObjective({
        [`regular_goals.${goal.id}.target`]: target,
      });
    },

    // updateRegularGoalTotal changes the total of a regular goal.
    updateRegularGoalTotal(goal, total) {
      this.updateObjective({
        [`regular_goals.${goal.id}.total`]: total,
      });
    },

    // updateRegularGoalUnit changes the unit of a regular goal.
    updateRegularGoalUnit(goal, unit) {
      this.updateObjective({
        [`regular_goals.${goal.id}.unit`]: unit,
      });
    },

    // updateRegularGoalCurrent changes the latest value of a regular goal.
    updateRegularGoalCurrent(goal, current) {
      let t = _.cloneDeep(goal.trajectory);
      t.insert(new Date().getTime(), current);
      t.compact_head(HOUR);

      this.updateObjective({
        [`regular_goals.${goal.id}.trajectory`]: Array.from(t),
      });
    },

    // deleteGoal removes the goal from its objective.
    deleteRegularGoal: function(goal) {
      if (confirm(`Really delete the regular goal "${goal.name}"?`)) {
        this.updateObjective({
          [`regular_goals.${goal.id}`]: firebase.firestore.FieldValue.delete()
        });
      }
    },

    // deleteObjective removes the objective from the user's collection.
    deleteObjective: function() {
      if (confirm(`Really delete the objective named "${this.objective.name}"?`)) {
        firebase.firestore()
          .collection('users')
          .doc(this.user_id)
          .collection('objectives')
          .doc(this.objective.id)
          .delete();
      }
    },
  },

  template: `
    <div class='objective'>
      <div class='objective-name'>
        {{ objective.name }}
        <button
            class="id"
            v-show="planning"
            v-on:click="copyObjectiveIdToClipboard()">
          {{ objective.id }}
        </button>
      </div>
      <div v-show='planning'>
        <button v-on:click='createGoal'>Add goal</button>
        <button v-on:click='createRegularGoal'>Add regular goal</button>
        <button v-on:click='deleteObjective'>Delete objective</button>
      </div>
      <div class='objective-description'><span v-html='descriptionHtml'></span></div>
      <goal
        v-for="g in objective.goals"
        v-bind:goal="g"
        v-bind:mode='mode'
        v-bind:key="g.id"
        v-on:increment="incrementGoal($event)"
        v-on:decrement="decrementGoal($event)"
        v-on:update-name="updateGoalName($event.goal, $event.name)"
        v-on:update-start="updateGoalStart($event.goal, $event.start)"
        v-on:update-end="updateGoalEnd($event.goal, $event.end)"
        v-on:update-baseline="updateGoalBaseline($event.goal, $event.baseline)"
        v-on:update-target="updateGoalTarget($event.goal, $event.target)"
        v-on:update-current="updateGoalCurrent($event.goal, $event.current)"
        v-on:update-unit="updateGoalUnit($event.goal, $event.unit)"
        v-on:delete="deleteGoal($event)"
      ></goal>
      <regular_goal
        v-for="g in objective.regular_goals"
        v-bind:goal="g"
        v-bind:mode='mode'
        v-bind:key="g.id"
        v-on:increment="incrementRegularGoal($event)"
        v-on:decrement="decrementRegularGoal($event)"
        v-on:update-name="updateRegularGoalName($event.goal, $event.name)"
        v-on:update-description="updateRegularGoalDescription($event.goal, $event.description)"
        v-on:update-window="updateRegularGoalWindow($event.goal, $event.window)"
        v-on:update-target="updateRegularGoalTarget($event.goal, $event.target)"
        v-on:update-total="updateRegularGoalTotal($event.goal, $event.total)"
        v-on:update-current="updateRegularGoalCurrent($event.goal, $event.current)"
        v-on:update-unit="updateRegularGoalUnit($event.goal, $event.unit)"
        v-on:delete="deleteRegularGoal($event)"
      ></regular_goal>
    </div>
  `,
});

// goalMixin provides common functionality to both the <goal> and the
// <regular-goal> Vue components.
let goalMixin = {
  props: ['goal', 'mode'],
  methods: {
    copyGoalIdToClipboard: function() {
      navigator.clipboard.writeText(this.goal.id);
    },
  },
};

// Registers the <goal> Vue component globally. This component renders a goal.
Vue.component('goal', {
  mixins: [goalMixin, modeMixin],
  computed: {
    currentXPos: function() {
      let now = new Date().getTime();
      return (100 * this.goal.time_spent(now) - 0.25) + '%';
    },
    endDate: function() {
      return new Date(this.goal.end).toISOString().slice(0, 10);
    },
    progressFillColor: function() {
      let now = new Date().getTime();
      let progressReport = new ProgressReport();
      return progressReport.progressFillColor(this.goal, now);
    },
    progressReport: function() {
      let now = new Date().getTime();
      let progressReport = new ProgressReport();
      return progressReport.progressStatus(this.goal, now);
    },
    progressPercentBounded: function() {
      return (100 * Math.max(Math.min(this.goal.progress, 1), 0)) + '%';
    },
    startDate: function() {
      return new Date(this.goal.start).toISOString().slice(0, 10);
    },
    trajectory_last_updated: function() {
      let format_date = (millis) => {
				let is = (a, b) => {
					return (
						a.getDate() == b.getDate() &&
						a.getMonth() == b.getMonth() &&
						a.getFullYear() == b.getFullYear());
				};
        let date = new Date(millis);
        let today = new Date();
        let yesterday = new Date(today.getTime() - DAY);
				let suffix = '';
				if (is(date, today)) {
					suffix = ' (today)';
				}
				if (is(date, yesterday)) {
					suffix = ' (yesterday)';
				}
        return new Date(date).toLocaleString() + suffix;
      };

      return `last updated ${format_date(this.goal.trajectory.latest.date)}`;
    },
    velocityReport: function() {
      let now = new Date().getTime();
      if (this.goal.stage != Stage.ARCHIVED) {
          if (this.goal.end < now) {
            return '';
          }
          let velocity = new VelocityReport();
          return velocity.report(this.goal, now);
      } else {
          return '';
      }
    },
    name: {
      get: function() {
        return this.goal.name;
      },
      set: _.debounce(function(name) {
        this.$emit('update-name', {
          goal: this.goal,
          name: name,
        });
      }, 1000),
    },
    start: {
      get: function() {
        return new Date(this.goal.start).toISOString().slice(0, 10);
      },
      set: _.debounce(function(start) {
        this.$emit('update-start', {
          goal: this.goal,
          start: new Date(start).getTime(),
        });
      }, 1000),
    },
    end: {
      get: function() {
        return new Date(this.goal.end).toISOString().slice(0, 10);
      },
      set: _.debounce(function(end) {
        this.$emit('update-end', {
          goal: this.goal,
          end: new Date(end).getTime(),
        });
      }, 1000),
    },
    baseline: {
      get: function() {
        return this.goal.baseline;
      },
      set: _.debounce(function(baseline) {
        this.$emit('update-baseline', {
          goal: this.goal,
          baseline: baseline,
        });
      }, 1000),
    },
    target: {
      get: function() {
        return this.goal.target;
      },
      set: _.debounce(function(target) {
        this.$emit('update-target', {
          goal: this.goal,
          target: target,
        });
      }, 1000),
    },
    current: {
      get: function() {
        return this.goal.trajectory.latest.value;
      },
      set: _.debounce(function(current) {
        this.$emit('update-current', {
          goal: this.goal,
          current: current,
        });
      }, 1000),
    },
    unit: {
      get: function() {
        return this.goal.unit
      },
      set: _.debounce(function(unit) {
        this.$emit('update-unit', {
          goal: this.goal,
          unit: unit,
        });
      }, 1000),
    },
  },
  template: `
    <div class='goal'>
      <div class='name'>{{ goal.name }} <button class="id" v-show="planning" v-on:click="copyGoalIdToClipboard()">{{ goal.id }}</button></div>
      <div v-show="planning">
        <button v-on:click="$emit('delete', goal)">delete</button>
      </div>
      <div v-show="tracking">
        <button v-on:click="$emit('increment', goal)">increment</button>
        <button v-on:click="$emit('decrement', goal)">decrement</button>
      </div>
      <svg class='chart' preserveAspectRatio='none'>
        <text
            class='status'
            text-anchor='middle'
            x='50%'
            y='20'>{{ progressReport }}</text>
        <rect
            width='100%'
            height=2
            fill='lightgrey'
            y=28></rect>
        <rect
            class='current'
            :width='progressPercentBounded'
            height=6
            :fill='progressFillColor'
            y=26></rect>
        <rect
            class='today'
            width='0.5%'
            height=14
            :x='currentXPos'
            :y=22></rect>
        <text
            class='start'
            text-anchor='start'
            x=0
            y=20>{{ startDate }}</text>
        <text
            class='end'
            text-anchor='end'
            x='100%'
            y=20>{{ endDate }}</text>
        <text
          class='baseline'
          text-anchor='start'
          x=0
          y=48>{{ goal.baseline }}</text>
        <text
            class='velocity'
            text-anchor='middle'
            x='50%'
            y='48'>{{ velocityReport }}</text>
        <text
          class='target'
          text-anchor='end'
          x='100%'
          y=48>{{ goal.target }} {{ goal.unit }}</text>
      </svg>
      <div class='edit' v-show="planning">
        <div><div>Name</div> <input type="text" v-model="name"></div>
        <div><div>Start</div> <input type="date" v-model="start"></div>
        <div><div>End</div> <input type="date" v-model="end"></div>
        <div><div>Baseline</div> <input type="number" v-model="baseline"></div>
        <div><div>Target</div> <input type="number" v-model="target"></div>
        <div><div>Current</div> <input type="number" v-model="current"> <div>{{ trajectory_last_updated }}</div></div>
        <div><div>Unit</div> <input type="text" v-model="unit"></div>
      </div>
    </div>
  `,
});

// Registers the <goal> Vue component globally. This component renders a
// regular goal.
Vue.component('regular_goal', {
  mixins: [goalMixin, modeMixin],
  computed: {
    barColor: function() {
      let now = new Date().getTime();
      return this.goal.budget_remaining_adjusted(now) > 0 ? 'rgb(136,187,77)' : 'rgb(187, 102, 77)'
    },
    barXPos: function() {
      let now = new Date().getTime();
      let b = this.goal.budget_remaining_adjusted(now);
      if (b > 0) {
        return '0%';
      } else {
        return (100-Math.max(0, Math.min(100, Math.abs((100 * b))))) + '%';
      }
    },
    barWidth: function() {
      let now = new Date().getTime();
      let b = this.goal.budget_remaining_adjusted(now);
      return Math.max(0, Math.min(100, Math.abs((100 * b)))) + '%';
    },
    budgetClass: function() {
      let now = new Date().getTime();
      if (this.goal.budget_remaining_adjusted(now) > 0) {
        return 'within-budget';
      } else {
        return 'out-of-budget';
      }
    },
    budgetRemaining: function() {
      let now = new Date().getTime();
      return (100 * this.goal.budget_remaining_adjusted(now)).toFixed(0) + '%';
    },
    descriptionHtml: function() {
      let markdown = new SafeMarkdownRenderer();
      return markdown.render(this.goal.description);
    },
    partialData: function() {
      let now = new Date().getTime();
      if (this.goal.partial_data(now)) {
        return '(partial data)';
      } else {
        return '';
      }
    },
    status: function() {
      let now = new Date().getTime();
      return `@ ${this.goal.value(now).toFixed(2)} of ${this.goal.total} ${this.goal.unit},
              targeting ${(this.goal.target * this.goal.total).toFixed(2)}
              over ${this.goal.window}-day window`;
    },
    trajectory_last_updated: function() {
      let format_date = (millis) => {
				let is = (a, b) => {
					return (
						a.getDate() == b.getDate() &&
						a.getMonth() == b.getMonth() &&
						a.getFullYear() == b.getFullYear());
				};
        let date = new Date(millis);
        let today = new Date();
        let yesterday = new Date(today.getTime() - DAY);
				let suffix = '';
				if (is(date, today)) {
					suffix = ' (today)';
				}
				if (is(date, yesterday)) {
					suffix = ' (yesterday)';
				}
        return new Date(date).toLocaleString() + suffix;
      };

      return `last updated ${format_date(this.goal.trajectory.latest.date)}`;
    },
    name: {
      get: function() {
        return this.goal.name;
      },
      set: _.debounce(function(name) {
        this.$emit('update-name', {
          goal: this.goal,
          name: name,
        });
      }, 1000),
    },
    description: {
      get: function() {
        return this.goal.description;
      },
      set: _.debounce(function(description) {
        this.$emit('update-description', {
          goal: this.goal,
          description: description,
        });
      }, 1000),
    },
    window: {
      get: function() {
        return this.goal.window;
      },
      set: _.debounce(function(window) {
        this.$emit('update-window', {
          goal: this.goal,
          window: window,
        });
      }, 1000),
    },
    target: {
      get: function() {
        return this.goal.target;
      },
      set: _.debounce(function(target) {
        this.$emit('update-target', {
          goal: this.goal,
          target: target,
        });
      }, 1000),
    },
    total: {
      get: function() {
        return this.goal.total;
      },
      set: _.debounce(function(total) {
        this.$emit('update-total', {
          goal: this.goal,
          total: total,
        });
      }, 1000),
    },
    current: {
      get: function() {
        return this.goal.trajectory.latest.value;
      },
      set: _.debounce(function(current) {
        this.$emit('update-current', {
          goal: this.goal,
          current: current,
        });
      }, 1000),
    },
    unit: {
      get: function() {
        return this.goal.unit
      },
      set: _.debounce(function(unit) {
        this.$emit('update-unit', {
          goal: this.goal,
          unit: unit,
        });
      }, 1000),
    },
  },
  template: `
    <div class="regular-goal">
      <div :class="budgetClass">
        <div class="name">{{ goal.name }} <button class="id" v-show="planning" v-on:click="copyGoalIdToClipboard()">{{ goal.id }}</button></div>
        <div v-show="planning">
          <button v-on:click="$emit('delete', goal)">delete</button>
        </div>
        <div v-show="tracking">
          <button v-on:click="$emit('increment', goal)">increment</button>
          <button v-on:click="$emit('decrement', goal)">decrement</button>
        </div>
        <div class="goal-description"><span v-html='descriptionHtml'></span></div>
        <div class="level">
          <span class="budget">{{ budgetRemaining }}</span>
          <span class="window"> of budget remaining {{ partialData }}</span>
          <span class="value">{{ status }}</span>
          <svg class="chart" preserveAspectRatio='none' style="height: 6px">
            <rect y="2" height="2" width="100%" fill="#ccc"></rect>
            <rect y="0" height="6" :x="barXPos" :width="barWidth" :fill="barColor"></rect>
          </svg>
        </div>
      </div>
      <div class='edit' v-show="planning">
        <div><div>Name</div> <input type="text" v-model="name"></div>
        <div><div>Description</div> <input type="text" v-model="description"></div>
        <div><div>Window</div> <input type="number" v-model="window"></div>
        <div><div>Target</div> <input type="number" v-model="target"></div>
        <div><div>Total</div> <input type="number" v-model="total"></div>
        <div><div>Current</div> <input type="number" v-model="current"> <div>{{ trajectory_last_updated }}</div></div>
        <div><div>Unit</div> <input type="text" v-model="unit"></div>
      </div>
    </div>
  `
});

// The main Vue instance that is driving the application.
let vue = new Vue({
  mixins: [modeMixin],

  el: '#app',

  data: {
    // See enum Mode.
    mode: Mode.VIEW,

    // objectives holds all of the objectives fetched from Firestore.
    // objectives is considered immutable, all changes to an objective or its
    // goals should be made directly in Firestore, relying on Firestore pushing
    // such changes back to the client. See also: class Objective.
    objectives: [],

    // user_id contains the ID of the Firebase user. If user_id is set, then
    // this means that a user is signed in and the client authenticated with
    // Firebase.
    user_id: '',

    // loaded signals when the objectives have been fetched from Firestore for
    // the first time. This is a useful signal for the application to make
    // other parts of the user interface available in synchronization. This
    // prevents the user interface from loading piece by piece. Instead, the
    // user interface should load in logical chunks.
    loaded: false,
  },
  
  computed: {
    signedIn: function() {
      return this.user_id != '';
    },
  },

  methods: {
    // copyUserIdToClipboard sets the clipboard to the ID of the signed-in user.
    copyUserIdToClipboard: function() {
      navigator.clipboard.writeText(this.user_id);
    },

    // createObjective adds a new objective to Firestore.
    createObjective: function() {
      let objective = new Objective({
        id: uuidv4(),
        name: 'AA New objective',
        description: '',
        goals: [],
        regular_goals: [],
      });
      firebase.firestore()
        .collection('users')
        .doc(this.user_id)
        .collection('objectives')
        .doc(objective.id)
        .withConverter(new ObjectiveConverter())
        .set(objective);
    },

    // listenToObjectives ensures that whenever any of the objectives changes in Firestore, the 
    // objectives on the client application are refreshed; Firestore is considered the source of
    // truth.
    listenToObjectives: function() {
      firebase.firestore()
        .collection('users')
        .doc(this.user_id)
        .collection('objectives')
        .withConverter(new ObjectiveConverter())
        .onSnapshot((snapshot) => {
          let objectives = [];
          snapshot.forEach((d) => {
            let o = d.data();
            o.goals = _.sortBy(o.goals, ['name', 'id']);
            o.regular_goals = _.sortBy(o.regular_goals, ['name', 'id']);
            objectives.push(d.data());
          });
          this.objectives = _.sortBy(objectives, ['name', 'id']);
          this.loaded = true;
        });
    },

    // signIn authenticates the client using redirect flow. The result of this
    // operation is handled in listener to onAuthStateChanged.
    signIn: function() {
      let provider = new firebase.auth.GoogleAuthProvider();
      firebase.auth().signInWithRedirect(provider);
    },

    // view switches the user interface into viewing mode.
    view: function() {
      this.mode = Mode.VIEW;
    },
    
    // track switches the user interface into tracking mode.
    track: function() {
      this.mode = Mode.TRACK;
    },

    // plan switcches the user interface into planning mode.
    plan: function() {
      this.mode = Mode.PLAN;
    },
  },
  template: `
    <div class='app'>
      <button
          id='signin'
          v-show='!signedIn'
          v-on:click="signIn">
        Sign in with Google
      </button>
      <div class='toolbar' v-show='loaded'>
        <button
            :disabled='viewing'
            v-on:click='view'>
          View
        </button>
        <button
            :disabled='tracking'
            v-on:click='track'>
          Track
        </button>
        <button
            :disabled='planning'
            v-on:click='plan'>
          Plan
        </button>
        <button
            class="id"
            v-show="planning"
            v-on:click="copyUserIdToClipboard()">
          {{ user_id }}
        </button>
      </div>
      <div class='toolbar' v-show='planning'>
        <button v-on:click='createObjective'>Add objective</button>
      </div>
      <objective
          v-for="o in objectives"
          v-bind:objective="o"
          v-bind:user_id='user_id'
          v-bind:mode='mode'
          v-bind:key="o.id">
      </objective>
    </div>
  `
});

// Listen to the results of the sign-in flow.
// Once, successfully authenticated, fetch the
// objectives from Firestore.
if (!testing) {
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      vue.user_id = user.uid;
      vue.listenToObjectives();
    }
  });
}
