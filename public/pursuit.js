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

Vue.component('objective', {
  computed: {
    descriptionHtml: function() {
      let markdown = new SafeMarkdownRenderer();
      return markdown.render(this.objective.description);
    },
    isPlanning: function() {
      return this.mode == 'plan';
    },
  },
  methods: {
    addGoal: function() {
      let goalId = uuidv4();
      let now = new Date().getTime();
      firebase.firestore()
        .collection('users')
        .doc(this.user_id)
        .collection('objectives')
        .doc(this.objective.id)
        .update({
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
    addRegularGoal: function() {
      let goalId = uuidv4();
      let now = new Date().getTime();
      firebase.firestore()
        .collection('users')
        .doc(this.user_id)
        .collection('objectives')
        .doc(this.objective.id)
        .update({
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
    updateGoalName(goal, name) {
      let update = null;
      update = {
        [`goals.${goal.id}.name`]: name,
      };
      
      firebase.firestore()
        .collection('users')
          .doc(this.user_id)
          .collection('objectives')
          .doc(this.objective.id)
          .update(update);
    },
    updateGoalStart(goal, start) {
      if (!confirm(`Changing the baseline will delete the trajectory of "${goal.name}", proceed?`)) {
        return;
      }
      let t = new Trajectory();
      t.insert(goal.start, goal.baseline);
      let update = {
        [`goals.${goal.id}.start`]: start,
        [`goals.${goal.id}.trajectory`]: Array.from(t),
      };
      
      firebase.firestore()
        .collection('users')
          .doc(this.user_id)
          .collection('objectives')
          .doc(this.objective.id)
          .update(update);
    },
    updateGoalEnd(goal, end) {
      let update = {
        [`goals.${goal.id}.end`]: end,
      };
      
      firebase.firestore()
        .collection('users')
          .doc(this.user_id)
          .collection('objectives')
          .doc(this.objective.id)
          .update(update);
    },
    updateGoalBaseline(goal, baseline) {
      if (!confirm(`Changing the baseline will delete trajectory of "${goal.name}", proceed?`)) {
        return;
      }
      let t = new Trajectory();
      t.insert(goal.start, baseline);
      let update = {
        [`goals.${goal.id}.start`]: goal.start,
        [`goals.${goal.id}.trajectory`]: Array.from(t),
      };
      
      firebase.firestore()
        .collection('users')
          .doc(this.user_id)
          .collection('objectives')
          .doc(this.objective.id)
          .update(update);
    },
    updateGoalTarget(goal, target) {
      let update = {
        [`goals.${goal.id}.target`]: target,
      };
      
      firebase.firestore()
        .collection('users')
          .doc(this.user_id)
          .collection('objectives')
          .doc(this.objective.id)
          .update(update);
    },
    updateGoalCurrent(goal, current) {
      let t = _.cloneDeep(goal.trajectory);
      t.insert(new Date().getTime(), current);
      t.compact_head(HOUR);

      firebase.firestore()
        .collection('users')
        .doc(this.user_id)
        .collection('objectives')
        .doc(this.objective.id)
        .update({
          [`goals.${goal.id}.trajectory`]: Array.from(t),
        });
    },
    updateGoalUnit(goal, unit) {
      firebase.firestore()
        .collection('users')
        .doc(this.user_id)
        .collection('objectives')
        .doc(this.objective.id)
        .update({
          [`goals.${goal.id}.unit`]: unit,
        });
    },
    deleteGoal: function(goal) {
      if (confirm(`Really delete the goal "${goal.name}"?`)) {
        firebase.firestore()
          .collection('users')
          .doc(this.user_id)
          .collection('objectives')
          .doc(this.objective.id)
          .update({
            [`goals.${goal.id}`]: firebase.firestore.FieldValue.delete()
          });
      }
    },
    deleteRegularGoal: function(goal) {
      if (confirm(`Really delete the regular goal "${goal.name}"?`)) {
        firebase.firestore()
          .collection('users')
          .doc(this.user_id)
          .collection('objectives')
          .doc(this.objective.id)
          .update({
            [`regular_goals.${goal.id}`]: firebase.firestore.FieldValue.delete()
          });
      }
    },
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
  props: ['mode', 'objective', 'user_id'],
  template: `
    <div class='objective'>
      <div class='objective-name'> {{ objective.name }} </div>
      <div v-show='isPlanning'>
        <button v-on:click='addGoal'>Add goal</button>
        <button v-on:click='addRegularGoal'>Add regular goal</button>
        <button v-on:click='deleteObjective'>Delete objective</button>
      </div>
      <div class='objective-description'><span v-html='descriptionHtml'></span></div>
      <goal
        v-for="g in objective.goals"
        v-bind:goal="g"
        v-bind:mode='mode'
        v-bind:key="g.id"
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
        v-on:delete="deleteRegularGoal($event)"
      ></regular_goal>
    </div>
  `,
});

Vue.component('goal', {
  computed: {
    currentXPos: function() {
      let now = new Date().getTime();
      return (100 * this.goal.time_spent(now) - 0.25) + '%';
    },
    endDate: function() {
      return new Date(this.goal.end).toISOString().slice(0, 10);
    },
    isPlanning: function() {
      return this.mode == 'plan';
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
  props: ['goal', 'mode'],
  template: `
    <div class='goal'>
      <div class='name'>{{ goal.name }}</div>
      <div v-show="isPlanning">
        <button v-on:click="$emit('delete', goal)">delete</button>
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
      <div class='edit' v-show="isPlanning">
        <div><div>Name</div> <input type="text" v-model="name"></div>
        <div><div>Start</div> <input type="date" v-model="start"></div>
        <div><div>End</div> <input type="date" v-model="end"></div>
        <div><div>Baseline</div> <input type="number" v-model="baseline"></div>
        <div><div>Target</div> <input type="number" v-model="target"></div>
        <div><div>Current</div> <input type="number" v-model="current"></div>
        <div><div>Unit</div> <input type="text" v-model="unit"></div>
      </div>
    </div>
  `,
});

Vue.component('regular_goal', {
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
    isPlanning: function() {
      return this.mode == 'plan';
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
  },
  props: ['goal', 'mode'],
  template: `
    <div class="regular-goal">
      <div :class="budgetClass">
        <div class="name">{{ goal.name }}</div>
        <div v-show="isPlanning">
          <button v-on:click="$emit('delete', goal)">delete</button>
        </div>
        <div class="goal-description">{{ goal.description }}</div>
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
    </div>
  `
});

let vue = new Vue({
  el: '#app',
  data: {
    mode: 'view',
    objectives: [
    ],
    user_id: '',
  },
  computed: {
    isPlanning: function() {
      return this.mode == 'plan';
    },
    isViewing: function() {
      return this.mode == 'view';
    },
    signedIn: function() {
      return this.user_id != '';
    },
  },
  methods: {
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
    listenToObjectives: function() {
      firebase.firestore()
        .collection('users')
        .doc(this.user_id)
        .collection('objectives')
        .withConverter(new ObjectiveConverter())
        .onSnapshot((snapshot) => {
          let objectives = [];
          snapshot.forEach((d) => {
            objectives.push(d.data());
          });
          objectives.sort((a, b) => {
            if (a.name > b.name) return 1;
            return -1;
          });
          objectives.forEach((o) => o.goals.sort((a, b) => {
            if (a.name > b.name) return 1;
            return -1;
          }));
          objectives.forEach((o) => o.regular_goals.sort((a, b) => {
            if (a.name > b.name) return 1;
            return -1;
          }));
          this.objectives = objectives;        
        });
    },
    plan: function() {
      this.mode = 'plan';
    },
    signIn: function() {
     let provider = new firebase.auth.GoogleAuthProvider();
     firebase.auth().signInWithRedirect(provider);
    },
    view: function() {
      this.mode = 'view';
    },
  },
  template: `
    <div class='app'>
      <div id='signin' v-if='!signedIn'><a href='#' v-on:click="signIn">Sign in with Google</a></div>
      <div class='toolbar'>
        <button v-on:click='plan' v-show='!isPlanning'>Plan</button>
        <button v-on:click='view' v-show='!isViewing'>View</button>
        <button v-on:click='createObjective' v-show='isPlanning'>Add objective</button>
      </div>
      <objective
        v-for="o in objectives"
        v-bind:objective="o"
        v-bind:user_id='user_id'
        v-bind:mode='mode'
        v-bind:key="o.id"
      ></objective>
    </div>
  `
});

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    vue.user_id = user.uid;
    vue.listenToObjectives();
  }
});