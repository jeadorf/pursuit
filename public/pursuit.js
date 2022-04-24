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

/**
 * Objective represents a set of goals. There are two kinds of goals: One-off
 * goals, and regular goals. One-off goals are scoped to a specific, fixed time
 * window. In contrast, regular goals are bound to a moving time window.
 */
class Objective {
  constructor({id, name, description, goals, regularGoals, budgetGoals}) {
    /** @private */
    this._id = id;
    /** @private */
    this._name = name;
    /** @private */
    this._description = description;
    /** @private */
    this._goals = goals;
    /** @private */
    this._regularGoals = regularGoals;
    /** @private */
    this._budgetGoals = budgetGoals;
  }

  /**
   * id uniquely identifies the objective, and is typically assigned by the
   * system rather than the user.
   * @type {string}
   */
  get id() {
    return this._id;
  }

  /**
   * name is the title of an objective.
   * @type {string}
   */
  get name() {
    return this._name;
  }

  /**
   * description provides a more detailed narrative about the objective than
   * the name alone.
   * @type {string}
   */
  get description() {
    return this._description;
  }

  /**
   * goals is the list of one-off goals of this objective. All instances in
   * this list must be of type Goal. See class Goal.
   * @type {Goal[]}
   */
  get goals() {
    return this._goals;
  }

  /**
   * regularGoals is the list of regular goals of this objective. All
   * instances in this list must be of type RegularGoal. See class RegularGoal.
   * @type {RegularGoal[]}
   */
  get regularGoals() {
    return this._regularGoals;
  }

  /**
   * budgetGoals is the list of budget goals of this objective. All
   * instances in this list must be of type BudgetGoal. See class BudgetGoal.
   * @type {BudgetGoal[]}
   */
   get budgetGoals() {
    return this._budgetGoals;
  }

  /**
   * goals replaces the set of one-off goals in this objective. See the
   * corresponding getter.
   * @param {Goal[]} goals
   */
  set goals(goals) {
    this._goals = goals;
  }

  /**
   * regularGoals replaces the set of one-off goals in this objective. See the
   * corresponding getter.
   * @param {RegularGoal[]} regularGoals
   */
  set regularGoals(regularGoals) {
    this._regularGoals = regularGoals;
  }

  /**
   * budgetGoals replaces the set of budget goals in this objective. See the
   * corresponding getter.
   * @param {BudgetGoal[]} budgetGoals
   */
   set budgetGoals(budgetGoals) {
    this._budgetGoals = budgetGoals;
  }
}

/**
 * Goal represents a one-off goal, defined by a fixed time window between a
 * start and end date, a target value which needs to be reached by the end date,
 * and the timeseries recording past progress (or regression).
 */
class Goal {
  constructor({
    id = '',
    name = '',
    unit = '',
    target = 1.0,
    start = 0,
    end = 0,
    trajectory = new Trajectory()
  }) {
    /** @private */
    this._id = id;
    /** @private */
    this._name = name;
    /** @private */
    this._unit = unit;
    /** @private */
    this._target = target;
    /** @private */
    this._start = start;
    /** @private */
    this._end = end;
    /** @private */
    this._trajectory = trajectory;
  }

  /**
   * id uniquely identifies the goal.
   * @type {string}
   */
  get id() {
    return this._id;
  }

  /**
   * name is the title of a goal.
   * @type {string}
   */
  get name() {
    return this._name;
  }

  /**
   * unit specifies the unit of the baseline, the target, and the values in the
   * timeseries, i.e. the trajectory.
   * @type {string}
   */
  get unit() {
    return this._unit;
  }

  /**
   * target specifies the value that the timeseries (trajectory) needs to reach
   * by the end date. If the target is reached, then the goal is said to be
   * complete.
   * @type {number}
   */
  get target() {
    return this._target;
  }

  /**
   * start date in milliseconds since epoch. The start date must not be greater
   * than the end date.
   * @type {number}
   */
  get start() {
    return this._start;
  }

  /**
   * end date in milliseconds since epoch. The end date must not be less than
   * the start date.
   * @type {number}
   */
  get end() {
    return this._end;
  }

  /**
   * trajectory describes the progress towards the goal. It is a timeseries. The
   * trajectory can be empty: this means that no values have been reported for
   * the goal.
   * @type {Trajectory}
   */
  get trajectory() {
    return this._trajectory;
  }

  /**
   * baseline describes the value of the trajectory at the start date.
   * @type {number}
   */
  get baseline() {
    return this.trajectory.at(this.start);
  }

  /**
   * progress returns the relative progress (a percentage) made towards the
   * target value, at the current point in time. 0% means that no progress has
   * been made, 100% or higher indicates that the goal is complete, and negative
   * values indicate a regression.
   * @type {number}
   */
  get progress() {
    if (!this.trajectory.length) {
      return NaN;
    }

    return (
        (this.trajectory.latest.value - this.baseline) /
        (this.target - this.baseline));
  }

  /**
   * timeSpent the percent of time that has passed at a given point in time
   * (by_date) since the start date, relative to the fixed time window set by
   * the start and end dates of the goal. 0% is the start date, 100% is the end
   * date.
   * @type {number}
   */
  timeSpent(by_date) {
    let total = this._end - this._start;
    let spent = by_date - this._start;
    return total == 0 ? 1.0 : spent / total;
  }

  /**
   * daysUntilStart returns the number of days that remain at a given point in
   * time until the start date.
   * @return {number}
   */
  daysUntilStart(by_date) {
    return (this.start - by_date) / DAY;
  }

  /**
   * daysUntilEnd returns the number of days that remain at a given point in
   * time until the end date.
   * @return {number}
   */
  daysUntilEnd(by_date) {
    return (this.end - by_date) / DAY;
  }

  /**
   * relativeProgress returns the progress towards the goal relative to the
   * time that has passed. The exact rationale behind the formula was
   * forgotten, but the idea was to indicate how much progress was made towards
   * the target compared to how much time has been spent since the start.
   */
  relativeProgress(by_date) {
    if (by_date <= this.start) {
      return 1.0;
    }
    let p = (this.trajectory.at(by_date) - this.baseline) / (this.target - this.baseline);
    let t = this.timeSpent(Math.min(by_date, this.end));
    return p / t;
  }

  /**
   * isOnTrack is true if and only if the progress towards the goal is at
   * least as fast as the passing of time. For example, if halfway between the
   * start and end date, the trajectory hais not proceeded at least halfway
   * from the baseline to the target, then the goal is off track.
   * @return {boolean}
   */
  isOnTrack(by_date) {
    return this.progress >= this.timeSpent(Math.min(this.end, by_date));
  }

  /**
   * velocity estimates the velocity of progress towards the target. See method
   * Trajectory.velocity.
   * @return {number}
   */
  velocity(by_date) {
    return this.trajectory.velocity(this.start, by_date);
  }

  /**
   * velocity estimates the velocity of progress towards the target over a 30
   * day window. See method Trajectory.velocity.
   * @return {number}
   */
  velocity30d(by_date) {
    return this.trajectory.velocity(
        Math.max(this.start, by_date - 30 * DAY), by_date);
  }

  /**
   * velocity _required estimates the velocity of progress that is required in
   * order to reach the target by the end date, i.e. to complete the goal in
   * time. For example, if you have 8 chapters left in a book, and 4 days left
   * on your holiday, then you need to read with a velocity of 2 chapters a day
   * in order to complete the book on your vacation.
   */
  velocityRequired(by_date) {
    return (this.target - this.trajectory.at(by_date)) / (this.end - by_date);
  }
}


/**
 * RegularGoal is a goal over a moving time window of fixed length. The regular
 * goal has a total, which describes the ideal difference between the
 * timeseries values at the boundaries of the time window. The regular goal has
 * a target, which specifies the percentage of the total, at which we still
 * consider the goal to be reached.
 */
class RegularGoal {
  constructor({
    id = '',
    name = '',
    description = '',
    unit = '',
    window = 28,
    target = 0.0,
    total = 0.0,
    trajectory = new Trajectory()
  }) {
    /** @private */
    this._id = id;
    /** @private */
    this._name = name;
    /** @private */
    this._description = description;
    /** @private */
    this._unit = unit;
    /** @private */
    this._window = window;
    /** @private */
    this._target = target;
    /** @private */
    this._total = total;
    /** @private */
    this._trajectory = trajectory;
  }

  /**
   * id uniquely identifies the (regular) goal.
   * @type {string}
   */
  get id() {
    return this._id;
  }

  /**
   * name is the title of the regular goal.
   * @type {string}
   */
  get name() {
    return this._name;
  }

  /**
   * description provides a more detailed narrative of what is to be achieved.
   * @type {string}
   */
  get description() {
    return this._description;
  }

  /**
   * unit describes the unit for the total, and for the values of the
   * timeseries (trajectory).
   * @type {string}
   */
  get unit() {
    return this._unit;
  }

  /**
   * window defines the length of the moving time window in days.
   * @type {number}
   */
  get window() {
    return this._window;
  }

  /**
   * target defines the percentage of the total that needs to be attained
   * within the moving time window.
   * @type {number}
   */
  get target() {
    return this._target;
  }

  /**
   * total provides the ideal difference of the timeseries between the start
   * and the end of the moving time window.
   * @type {number}
   */
  get total() {
    return this._total;
  }

  /**
   * trajectory describes the progress towards the goal. It is a timeseries.
   * The trajectory can be empty: this means that no values have been reported
   * for the goal.
   * @type {Trajectory}
   */
  get trajectory() {
    return this._trajectory;
  }

  /**
   * value describes the progress at a given point in time (the end of the time
   * window) relative to the start of the moving time window. For example, if
   * the number of pizzas eaten was 12 at the start of the window, and the
   * number of pizzas eaten is 21 at the end of the window, the value is 21 -
   * 12 = 9.
   * @type {number}
   */
  value(by_date) {
    return (
        this.trajectory.at(by_date) -
        this.trajectory.at(by_date - this.window * DAY));
  }

  /**
   * budget_remaining returns the percentage of the permissible shortfall from
   * the total; this budget is equivalent to the error budget of a Service
   * Level Objectives (SLO).
   * @type {number}
   */
  budgetRemaining(by_date) {
    return (this.value(by_date) - this.target) / (this.total - this.target);
  }

  /**
   * budget_remaining_prorated is like budget_remaining, but adjusts for
   * partial data, i.e. when the moving window extends to earlier dates than
   * where recordings were available.
   * @type {number}
   */
  budgetRemainingProrated(by_date) {
    if (!this.trajectory.earliest) {
      return NaN;
    }
    if (this.partialData(by_date)) {
      let r = (by_date - this.trajectory.earliest.date) / (this.window * DAY);
      let b = (this.value(by_date) - r * this.target) /
          (r * this.total - r * this.target);
      return Math.min(1.0, b);
    }
    return this.budgetRemaining(by_date);
  }

  /**
   * partialData returns true if the trajectory does not contain any point
   * earlier than the start of the moving time window.
   * @type {boolean}
   */
  partialData(by_date) {
    if (!this.trajectory.earliest) {
      return NaN;
    }
    return this.trajectory.earliest.date > (by_date - this.window * DAY);
  }
}


/**
 * BudgetGoal aims at keeping an indicator within a certain budget.
 * This is loosely modeled after service-level objectives, see
 * https://sre.google/sre-book/service-level-objectives/.
 */
 class BudgetGoal {
  constructor({
    id = '',
    name = '',
    description = '',
    target = 0.0,
    current = 0.0,
  }) {
    /** @private */
    this._id = id;
    /** @private */
    this._name = name;
    /** @private */
    this._description = description;
    /** @private */
    this._target = target;
    /** @private */
    this._current = current;
  }

  /**
   * id uniquely identifies the (budget) goal.
   * @type {string}
   */
   get id() {
    return this._id;
  }

  /**
   * name is the title of the budget goal.
   * @type {string}
   */
  get name() {
    return this._name;
  }

  /**
   * description provides a more detailed narrative of what is to be achieved.
   * @type {string}
   */
   get description() {
    return this._description;
  }

  /**
   * target specifies when the goal is met, i.e. the goal is met if and only if
   * current >= target. Constraint: 0 <= target <= 1.   
   * @type {number}
   */
   get target() {
    return this._target;
  }

  /**
   * current is the latest value of the indicator.
   * @type {number}
   */
   get current() {
    return this._current;
  }

  /**
   * budget is equal to 1 - target, and describes how much shortfall from 100%
   * is acceptable.
   * @type {number}
   */
   get budget() {
    return 1.0 - this.target;
  }

  /**
   * budgetRemaining returns the fraction of how much of the budget remains,
   * equivalent to (current - target) / budget. Negative, if no budget remains.
   * @type {number}
   */
   get budgetRemaining() {
      return (this.current - this.target) / this.budget;
   }
}


/**
 * GoalType represents which .
 * @enum {string}
 */
 const GoalType = {
  /**
   * ONE_OFF indicates instance of {@type Goal}.
   */
  ONE_OFF: 'one-off',

  /**
   * REGULAR indicates instance of {@type RegularGoal}.
   */
  REGULAR: 'regular',

  /**
   * BUDGET indicates instance of {@type BudgetGoal}.
   */
  BUDGET: 'budget',
};


/** Trajectory is a timeseries, i.e. a list of dated values. */
class Trajectory {
  constructor() {
    /** @private */
    this._line = [];
  }

  /**
   * insert adds a point to the timeseries. It is possible to insert points
   * out-of-order.
   * @return {Trajectory}
   */
  insert(date, value) {
    let p = this._line.length;
    while (p > 0 && this._line[p - 1].date >= date) {
      --p;
    }
    this._line.splice(
        p, p < this._line.length && this._line[p].date == date ? 1 : 0,
        {date, value});
    return this;
  }

  /**
   * at returns the value of the timeseries at a given point in time,
   * extrapolating at both ends of the timeseries, and interpolating in between
   * two adjacent points in the timeseries.
   * @return {number}
   */
  at(date) {
    if (!this._line.length) {
      return undefined;
    }

    /** extrapolate on the left */
    if (this.earliest.date >= date) {
      return this.earliest.value;
    }

    /** extrapolate on the right */
    if (this.latest.date <= date) {
      return this.latest.value;
    }

    /** interpolate */
    let i0;
    for (i0 = 0; i0 < this._line.length - 1 && this._line[i0 + 1].date <= date;
         i0++) {
    }
    let i2 = i0 + 1;
    let t0 = this._line[i0].date;
    let t2 = this._line[i2].date;
    let m0 = this._line[i0].value;
    let m2 = this._line[i2].value;
    return m0 + (date - t0) * (m2 - m0) / (t2 - t0);
  }

  /**
   * remove deletes points from the timeseries at the specified date.
   * @return {Trajectory}
   */
  remove(date) {
    for (let i = 0; i < this._line.length; i++) {
      if (this._line[i].date == date) {
        this._line.splice(i, 1);
        return this;
      }
    }
    return this;
  }

  /**
   * compactHead removes entries from the timeline that happened within an hour
   * of the latest entry. Never removes the earliest or latest entry from the
   * trajectory.
   *
   * Calling compactHead() after insertions into the trajectory helps reducing
   * the rate of changes recorded and ensures that transient states while the
   * user is editing the goal are discarded.
   */
  compactHead(duration = HOUR) {
    let head = this._line.pop();
    for (let i = this._line.length - 1;
         i > 0 && head.date - this._line[i].date <= DAY; i--) {
      this._line.pop();
    }
    this._line.splice(this._line.length, 0, head);
  }

  /**
   * velocity returns the estimated velocity over a given period of time.  The
   * terminology here is inspired from atimeseries measuring the "distance
   * traveled".
   * @param {number} a
   * @param {number} b
   */
  velocity(a, b) {
    return (this.at(b) - this.at(a)) / (b - a);
  }

  /**
   * earliest returns the earliest (smallest timestamp) point in the
   * timeseries.
   * @type {number}
   */
  get earliest() {
    if (!this._line) {
      return NaN;
    }
    return this._line[0];
  }

  /**
   * latest returns the latest (biggest timestamp) point in the timeseries.
   * @type {number}
   */
  get latest() {
    if (!this._line) {
      return NaN;
    }
    return this._line[this._line.length - 1];
  }

  /**
   * length returns the number of points in the timeseries.
   * @type {number}
   */
  get length() {
    return this._line.length;
  }

  /** [Symbol.iterator] returns iterator over all points in the timeseries. */
  [Symbol.iterator]() {
    return this._line[Symbol.iterator]();
  }
};


/**
 * ObjectiveConverter serializes and deserializes objectives from their
 * representation in Firestore.
 */
class ObjectiveConverter {
  /**
   * toFirestore converts an objective to its Firestore representation.
   * @param {!Objective} objective
   */
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
        trajectory: Array.from(g.trajectory),
      };
    }
    let regularGoals = {};
    for (let g of objective.regularGoals) {
      regularGoals[g.id] = {
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
    let budgetGoals = {};
    for (let g of objective.budgetGoals) {
      budgetGoals[g.id] = {
        id: g.id,
        name: g.name,
        description: g.description,
        target: g.target,
        current: g.current,
      };
    }
    return {
      name: objective.name,
      description: objective.description,
      goals: goals,
      regular_goals: regularGoals,
      budget_goals: budgetGoals,
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
        trajectory: t,
      }));
    }

    let regularGoals = [];
    for (let id in objective.regular_goals) {
      let g = objective.regular_goals[id];
      let t = new Trajectory();
      if (g.trajectory) {
        for (let {date, value} of g.trajectory) {
          t.insert(date, value);
        }
      }
      regularGoals.push(new RegularGoal({
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

    let budgetGoals = [];
    for (let id in objective.budget_goals) {
      let g = objective.budget_goals[id];
      budgetGoals.push(new BudgetGoal({
        id: id,
        name: g.name,
        description: g.description,
        target: g.target,
        current: g.current,
      }));
    }

    return new Objective({
      id: snapshot.id,
      name: objective.name,
      description: objective.description,
      goals: goals,
      regularGoals: regularGoals,
      budgetGoals: budgetGoals,
    });
  }
}

/**
 * SafeMarkdownRenderer renders markdown to HTML.
 */
class SafeMarkdownRenderer {
  render(markdown) {
    if (!markdown) {
      return '';
    }
    let rawHtml = marked.parse(markdown);
    return sanitizeHtml(rawHtml, {
      allowedTags: [
        'a',
        'p',
        'code',
        'em',
        'strong',
        'ul',
        'ol',
        'li',
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
        'a': [
          'http',
          'https',
        ],
      },
    });
  }
}

/**
 * VelocityReport provides descriptions of velocity towards a goal.
 */
class VelocityReport {
  /**
   * @param {Goal} goal 
   * @param {number} by_date 
   */
  report(goal, by_date) {
    let v = goal.velocity30d(by_date) * DAY;
    let rv = goal.velocityRequired(by_date) * DAY;
    let round = (f) => f.toFixed(1);
    // Attempt to choose a time period where there was at least one unit of
    // progress.There are alternative ways of choosing a sensible period of
    // time, e.g.based on the rate (target - baseline) / (end - start).
    if (v >= 1 || rv >= 1) {
      return `30d: ${round(v)} ${goal.unit} per day; now need ${round(rv)} ${
          goal.unit} per day`;
    } else if (v * 7 >= 1 || rv * 7 >= 1) {
      return `30d: ${round(v * 7)} ${goal.unit} per week; now need ${
          round(rv * 7)} ${goal.unit} per week`;
    } else {
      return `30d: ${round(v * 30)} ${goal.unit} per month; now need ${
          round(rv * 30)} ${goal.unit} per month`;
    }
  }
}

/**
 * ProgressReport provides descriptions of progress towards a goal.
 */
class ProgressReport {
  /**
   * @param {Goal} goal 
   * @param {number} by_date 
   */
  progressFillColor(goal, by_date) {
    let s = 0.8;
    let w = (goal.relativeProgress(by_date) - s) / (1.0 - s);
    w = Math.min(1.0, w);
    w = Math.max(0.0, w);
    let r = (1.0 - w) * 187 + w * 136;
    let g = (1.0 - w) * 102 + w * 187;
    let b = 77;
    return `rgb(${r},${g},${b})`;
  }

  /**
   * @param {Goal} goal 
   * @param {number} by_date 
   */
  progressStatus(goal, by_date) {
    let daysUntilStart = goal.daysUntilStart(by_date);
    let daysUntilEnd = goal.daysUntilEnd(by_date);
    if (by_date < goal.start) {
      return `${daysUntilStart.toFixed(0)} days until start, nothing to do`;
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
        if (goal.isOnTrack(by_date)) {
          return `${daysUntilEnd.toFixed(0)} days left, on track @ ${
              (100 * goal.progress).toFixed(1)}% (${goal.trajectory.latest.value.toFixed(1)})`;
        } else {
          return `${daysUntilEnd.toFixed(0)} days left, behind @ ${
              (100 * goal.progress).toFixed(1)}% (${goal.trajectory.latest.value.toFixed(1)})`;
        }
      }
    }
  }
}

/**
 * Mode represents different UI: viewing, tracking, or planning.
 * @enum {string}
 */
const Mode = {
  /**
   * VIEW is a "read-only" mode. When viewing, the user can see their
   * objectives and goals, and thus see progress. However, the user cannot
   * change objectives or goals. This prevents accidental changes, and avoids
   * distracting elements.
   */
  VIEW: 'view',

  /**
   * TRACK is a mode which allows the user to conveniently update the progress
   * for their goals. Still, this mode only provides the minimum surface for
   * updating progress, avoiding other distracting elements, and preventing
   * accidental changes.
   */
  TRACK: 'track',

  /**
   * PLAN is a mode which gives the user full control (CRUD) over objectives
   * and goals.
   */
  PLAN: 'plan',
};

/**
 * modeMixin provides common functionality to both the <goal> and the
 * <regular-goal> Vue components.
 */
let modeMixin = {
  props: ['mode'],

  computed: {
    viewing() {
      return this.mode == Mode.VIEW;
    },

    tracking() {
      return this.mode == Mode.TRACK;
    },

    planning() {
      return this.mode == Mode.PLAN;
    },
  },
};

/**
 * Mode represents different UI: viewing, tracking, or planning.
 * @enum {string}
 */
const ClipboardAction = {
  /**
   * CUT indicates that the goal should be moved rather than copied.
   */
  CUT: 'cut',

  /**
   * COPY indicates that the goal should be cloned rather than moved.
   */
  COPY: 'copy',
};


/**
 * Registers the <objective> Vue component globally. This component renders an
 * objective and its goals.
 */
Vue.component('objective', {
  mixins: [modeMixin],

  props: ['objective', 'user_id'],

  computed: {
    descriptionHtml() {
      let markdown = new SafeMarkdownRenderer();
      return markdown.render(this.objective.description);
    },

    name: {
      get() {
        return this.objective.name;
      },
      set: _.debounce(
          function(name) {
            this.updateObjective({
              [`name`]: name,
            });
          },
          1000),
    },
  
    description: {
      get() {
        return this.objective.description;
      },
      set: _.debounce(
          function(description) {
            this.updateObjective({
              [`description`]: description,
            });
          },
          1000),
    },
  },

  methods: {
    /** updateObjective makes changes to the objective in Firestore.  */
    updateObjective(update) {
      firebase.firestore()
          .collection('users')
          .doc(this.user_id)
          .collection('objectives')
          .doc(this.objective.id)
          .update(update);
    },

    /** createGoal adds a new goal to the objective in Firestore. */
    createGoal() {
      let goalId = uuidv4();
      let now = new Date().getTime();
      this.updateObjective({
        [`goals.${goalId}.name`]: 'AA New goal',
        [`goals.${goalId}.unit`]: '',
        [`goals.${goalId}.start`]: now,
        [`goals.${goalId}.end`]: now + 7 * DAY,
        [`goals.${goalId}.target`]: 100,
        [`goals.${goalId}.trajectory`]: [
          {date: now, value: 0},
        ],
      });
    },

    /**
     * createRegularGoal adds a new regular goal to the objective in Firestore.
     */
    createRegularGoal() {
      let goalId = uuidv4();
      let now = new Date().getTime();
      this.updateObjective({
        [`regular_goals.${goalId}.name`]: 'AA New regular goal',
        [`regular_goals.${goalId}.description`]: '',
        [`regular_goals.${goalId}.unit`]: '',
        [`regular_goals.${goalId}.total`]: 100,
        [`regular_goals.${goalId}.target`]: 0,
        [`regular_goals.${goalId}.window`]: 28,
        [`regular_goals.${goalId}.trajectory`]: [
          {date: now, value: 0},
        ],
      });
    },

    /**
     * createBudgetGoal adds a new budget goal to the objective in Firestore.
     */
     createBudgetGoal() {
      let goalId = uuidv4();
      this.updateObjective({
        [`budget_goals.${goalId}.name`]: 'AA New budget goal',
        [`budget_goals.${goalId}.description`]: '',
        [`budget_goals.${goalId}.target`]: 0.0,
        [`budget_goals.${goalId}.current`]: 0.0,
      });
    },

    /** copyObjectiveIdToClipboard puts the objective ID into the clipboard. */
    copyObjectiveIdToClipboard() {
      navigator.clipboard.writeText(this.objective.id);
    },

    /** incrementGoal increments the latest value of a goal by one. */
    incrementGoal(goal) {
      let t = _.cloneDeep(goal.trajectory);
      t.insert(new Date().getTime(), t.latest.value + 1);
      t.compactHead(HOUR);

      this.updateObjective({
        [`goals.${goal.id}.trajectory`]: Array.from(t),
      });
    },

    /** decrementGoal decrements the latest value of a goal by one. */
    decrementGoal(goal) {
      let t = _.cloneDeep(goal.trajectory);
      t.insert(new Date().getTime(), t.latest.value - 1);
      t.compactHead(HOUR);

      this.updateObjective({
        [`goals.${goal.id}.trajectory`]: Array.from(t),
      });
    },

    /** updateGoalName renames the goal. */
    updateGoalName(goal, name) {
      this.updateObjective({
        [`goals.${goal.id}.name`]: name,
      });
    },

    /**
     * updateGoalStart changes the start date of the goal. It is not obvious
     * what to do if the trajectory already contains point past the previous
     * start date. Users should not change the start date for any goals after
     * they already made progress on these goals.  If users still want to
     * change the start date, they will have to reset the trajectory.  Smarter
     * implementations are possible.
     */
    updateGoalStart(goal, start) {
      if (!confirm(`Changing the baseline will delete the trajectory of "${
              goal.name}", proceed?`)) {
        return;
      }
      let t = new Trajectory();
      t.insert(goal.start, goal.baseline);
      this.updateObjective({
        [`goals.${goal.id}.start`]: start,
        [`goals.${goal.id}.trajectory`]: Array.from(t),
      });
    },

    /** updateGoalStart changes the end date of the goal. */
    updateGoalEnd(goal, end) {
      this.updateObjective({
        [`goals.${goal.id}.end`]: end,
      });
    },

    /** updateGoalBaseline changes the end date of the goal. */
    updateGoalBaseline(goal, baseline) {
      if (!confirm(`Changing the baseline will delete trajectory of "${
              goal.name}", proceed?`)) {
        return;
      }
      let t = new Trajectory();
      t.insert(goal.start, baseline);
      this.updateObjective({
        [`goals.${goal.id}.start`]: goal.start,
        [`goals.${goal.id}.trajectory`]: Array.from(t),
      });
    },

    /** updateGoalTarget changes the target of the goal. */
    updateGoalTarget(goal, target) {
      this.updateObjective({
        [`goals.${goal.id}.target`]: target,
      });
    },

    /** updateGoalCurrent changes the latest value of the goal. */
    updateGoalCurrent(goal, current) {
      let t = _.cloneDeep(goal.trajectory);
      t.insert(new Date().getTime(), current);
      t.compactHead(HOUR);

      this.updateObjective({
        [`goals.${goal.id}.trajectory`]: Array.from(t),
      });
    },

    /** updateGoalUnit changes the unit of the goal. */
    updateGoalUnit(goal, unit) {
      this.updateObjective({
        [`goals.${goal.id}.unit`]: unit,
      });
    },

    /** copyGoal emits an event about copying the goal from the objective. */
    copyGoal(goal) {
      this.$emit('copy', {
        fromObjective: this.objective,
        goal: goal,
        action: ClipboardAction.COPY,
        type: GoalType.ONE_OFF,
      });
    },

    /** cutGoal emits an event about cutting the goal from the objective. */
    cutGoal(goal) {
      this.$emit('cut', {
        fromObjective: this.objective,
        goal: goal,
        action: ClipboardAction.CUT,
        type: GoalType.ONE_OFF,
      });
    },

    /** deleteGoal removes the goal from its objective. */
    deleteGoal(goal) {
      if (confirm(`Really delete the goal "${goal.name}"?`)) {
        this.updateObjective(
            {[`goals.${goal.id}`]: firebase.firestore.FieldValue.delete()});
      }
    },

    /**
     * incrementRegularGoal increments the latest value of a regular goal by
     * one.
     */
    incrementRegularGoal(goal) {
      let t = _.cloneDeep(goal.trajectory);
      t.insert(new Date().getTime(), t.latest.value + 1);
      t.compactHead(HOUR);

      this.updateObjective({
        [`regular_goals.${goal.id}.trajectory`]: Array.from(t),
      });
    },

    /**
     * decrementRegularGoal decrements the latest value of a regular goal by
     * one.
     */
    decrementRegularGoal(goal) {
      let t = _.cloneDeep(goal.trajectory);
      t.insert(new Date().getTime(), t.latest.value - 1);
      t.compactHead(HOUR);

      this.updateObjective({
        [`regular_goals.${goal.id}.trajectory`]: Array.from(t),
      });
    },

    /** updateRegularGoalName renames a regular goal. */
    updateRegularGoalName(goal, name) {
      this.updateObjective({
        [`regular_goals.${goal.id}.name`]: name,
      });
    },

    /**
       updateRegularGoalDescription changes the description of a regular goal.
     */
    updateRegularGoalDescription(goal, description) {
      this.updateObjective({
        [`regular_goals.${goal.id}.description`]: description,
      });
    },

    /** updateRegularGoalWindow changes the window of a regular goal. */
    updateRegularGoalWindow(goal, window) {
      this.updateObjective({
        [`regular_goals.${goal.id}.window`]: window,
      });
    },

    /** updateRegularGoalTarget changes the target of a regular goal. */
    updateRegularGoalTarget(goal, target) {
      this.updateObjective({
        [`regular_goals.${goal.id}.target`]: target,
      });
    },

    /** updateRegularGoalTotal changes the total of a regular goal. */
    updateRegularGoalTotal(goal, total) {
      this.updateObjective({
        [`regular_goals.${goal.id}.total`]: total,
      });
    },

    /**
     * updateRegularGoalUnit changes the unit of a regular goal.
     * @param {RegularGoal} goal
     * @param {string} unit
     */
    updateRegularGoalUnit(goal, unit) {
      this.updateObjective({
        [`regular_goals.${goal.id}.unit`]: unit,
      });
    },

    /** updateRegularGoalCurrent changes the latest value of a regular goal. */
    updateRegularGoalCurrent(goal, current) {
      let t = _.cloneDeep(goal.trajectory);
      t.insert(new Date().getTime(), current);
      t.compactHead(HOUR);

      this.updateObjective({
        [`regular_goals.${goal.id}.trajectory`]: Array.from(t),
      });
    },

    /** copyRegularGoal emits an event about copying the regular goal from the
     * objective. */
    copyRegularGoal(goal) {
      this.$emit('copy', {
        fromObjective: this.objective,
        goal: goal,
        action: ClipboardAction.COPY,
        type: GoalType.REGULAR,
      });
    },

    /** cutRegularGoal emits an event about cutting the regular goal from the
     * objective. */
    cutRegularGoal(goal) {
      this.$emit('cut', {
        fromObjective: this.objective,
        goal: goal,
        action: ClipboardAction.CUT,
        type: GoalType.REGULAR,
      });
    },

    /** deleteRegularGoal removes the goal from its objective. */
    deleteRegularGoal(goal) {
      if (confirm(`Really delete the regular goal "${goal.name}"?`)) {
        this.updateObjective({
          [`regular_goals.${goal.id}`]: firebase.firestore.FieldValue.delete()
        });
      }
    },

    /** updateBudgetGoalName renames a budget goal. */
    updateBudgetGoalName(goal, name) {
      this.updateObjective({
        [`budget_goals.${goal.id}.name`]: name,
      });
    },

    /**
       updateBudgetGoalDescription changes the description of a budget goal.
     */
       updateBudgetGoalDescription(goal, description) {
      this.updateObjective({
        [`budget_goals.${goal.id}.description`]: description,
      });
    },

    /** updateBudgetGoalTarget changes the target of a budget goal. */
    updateBudgetGoalTarget(goal, target) {
      this.updateObjective({
        [`budget_goals.${goal.id}.target`]: target,
      });
    },

    /** updateBudgetGoalCurrent changes the current value of a budget goal. */
    updateBudgetGoalCurrent(goal, current) {
      this.updateObjective({
        [`budget_goals.${goal.id}.current`]: current,
      });
    },

    /** copyBudgetGoal emits an event about copying the budget goal from the
     * objective. */
     copyBudgetGoal(goal) {
      this.$emit('copy', {
        fromObjective: this.objective,
        goal: goal,
        action: ClipboardAction.COPY,
        type: GoalType.BUDGET,
      });
    },

    /** cutBudgetGoal emits an event about cutting the regular goal from the
     * objective. */
    cutBudgetGoal(goal) {
      this.$emit('cut', {
        fromObjective: this.objective,
        goal: goal,
        action: ClipboardAction.CUT,
        type: GoalType.BUDGET,
      });
    },

    /** deleteBudgetGoal removes the goal from its objective. */
    deleteBudgetGoal(goal) {
      if (confirm(`Really delete the budget goal "${goal.name}"?`)) {
        this.updateObjective({
          [`budget_goals.${goal.id}`]: firebase.firestore.FieldValue.delete()
        });
      }
    },

    /** paste */
    paste() {
      this.$emit('paste', this.objective);
    },

    /** deleteObjective removes the objective from the user's collection. */
    deleteObjective() {
      if (confirm(
              `Really delete the objective named "${this.objective.name}"?`)) {
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
    <div class="objective">
      <div class="objective-name">
        {{ objective.name }}
        <button
            class="id"
            v-if="planning"
            v-on:click="copyObjectiveIdToClipboard()">
          {{ objective.id }}
        </button>
      </div>
      <div v-show="planning">
        <button v-on:click="createGoal">Add goal</button>
        <button v-on:click="createRegularGoal">Add regular goal</button>
        <button v-on:click="createBudgetGoal">Add budget goal</button>
        <button v-on:click="paste">Paste goal</button>
        <button v-on:click="deleteObjective">Delete objective</button>
      </div>
      <div v-show="planning" class="edit">
        <div><div>Name</div> <input type="text" v-model="name"></div>
        <div><div>Description</div> <textarea type="text" v-model="description"></textarea></div>
      </div>
      <div class="objective-description"><span v-html="descriptionHtml"></span></div>
      <goal
        v-for="g in objective.goals"
        v-bind:goal="g"
        v-bind:mode="mode"
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
        v-on:copy="copyGoal($event)"
        v-on:cut="cutGoal($event)"
        v-on:delete="deleteGoal($event)"
      ></goal>
      <regular-goal
        v-for="g in objective.regularGoals"
        v-bind:goal="g"
        v-bind:mode="mode"
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
        v-on:copy="copyRegularGoal($event)"
        v-on:cut="cutRegularGoal($event)"
        v-on:delete="deleteRegularGoal($event)"
      ></regular-goal>
      <budget-goal
        v-for="g in objective.budgetGoals"
        v-bind:goal="g"
        v-bind:mode="mode"
        v-bind:key="g.id"
        v-on:update-name="updateBudgetGoalName($event.goal, $event.name)"
        v-on:update-description="updateBudgetGoalDescription($event.goal, $event.description)"
        v-on:update-target="updateBudgetGoalTarget($event.goal, $event.target)"
        v-on:update-current="updateBudgetGoalCurrent($event.goal, $event.current)"
        v-on:copy="copyBudgetGoal($event)"
        v-on:cut="cutBudgetGoal($event)"
        v-on:delete="deleteBudgetGoal($event)"
      ></budget-goal>
    </div>
  `,
});

/**
 * goalMixin provides common functionality to both the <goal> and the
 * <regular-goal> Vue components.
 */
let goalMixin = {
  props: ['goal'],

  computed: {
    trajectory_last_updated() {
      let format_date = (millis) => {
        let is = (a, b) => {
          return (
              a.getDate() == b.getDate() && a.getMonth() == b.getMonth() &&
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

      if (!this.goal.trajectory.latest) {
        return `last updated ${NaN}`;
      }

      return `last updated ${format_date(this.goal.trajectory.latest.date)}`;
    },

    current: {
      get() {
        if (!this.goal.trajectory.latest) {
          return NaN;
        }
        return this.goal.trajectory.latest.value;
      },
      set: _.debounce(
          function(current) {
            this.$emit('update-current', {
              goal: this.goal,
              current: current,
            });
          },
          1000),
    },
  },

  methods: {
    copyGoalIdToClipboard() {
      navigator.clipboard.writeText(this.goal.id);
    },
  },
};


let localeMixin = {
  props: ['locale', 'timezone'],

  methods: {
    /**
     * inputformat takes a time specified in milliseconds since epoch, and
     * returns the date formatted as a string ("yyyy-mm-dd"). This is useful
     * when passing input to HTML <input> elements. I have no definite idea
     * of what timezone <input type="date"> expects when <input> is given dates
     * formatted as "yyyy-mm-dd" ... betting though that <input> interprets
     * the given strings in local time ... oh, this method does not make me
     * proud, but I don't want to install more libraries just to delegate this
     * one problem away.
     * @param {number} millis
     */
    inputformat(millis) {
      let parts =
          (new Date(millis).toLocaleDateString('de-DE').split('.').reverse());
      if (parts[1].length == 1) {
        parts[1] = '0' + parts[1];
      }
      if (parts[2].length == 1) {
        parts[2] = '0' + parts[2];
      }
      return parts.join('-');
    },
  },
};


/**
 * Registers the <goal> Vue component globally. This component renders a goal.
 */
Vue.component('goal', {
  mixins: [goalMixin, localeMixin, modeMixin],

  computed: {
    currentXPos() {
      let now = new Date().getTime();
      return (100 * this.goal.timeSpent(now) - 0.25) + '%';
    },

    endDate() {
      return new Date(this.goal.end).toLocaleDateString(this.locale, {
        timeZone: this.timezone
      });
    },

    progressFillColor() {
      let now = new Date().getTime();
      let progressReport = new ProgressReport();
      return progressReport.progressFillColor(this.goal, now);
    },

    progressReport() {
      let now = new Date().getTime();
      let progressReport = new ProgressReport();
      return progressReport.progressStatus(this.goal, now);
    },

    progressPercentBounded() {
      return (100 * Math.max(Math.min(this.goal.progress, 1), 0)) + '%';
    },

    startDate() {
      return new Date(this.goal.start).toLocaleDateString(this.locale, {
        timeZone: this.timezone
      });
    },

    velocityReport() {
      let now = new Date().getTime();
      if (this.goal.end < now) {
        return '';
      }
      let velocity = new VelocityReport();
      return velocity.report(this.goal, now);
    },

    name: {
      get() {
        return this.goal.name;
      },
      set: _.debounce(
          function(name) {
            this.$emit('update-name', {
              goal: this.goal,
              name: name,
            });
          },
          1000),
    },

    start: {
      get() {
        return this.inputformat(this.goal.start);
      },
      set: _.debounce(
          function(start) {
            this.$emit('update-start', {
              goal: this.goal,
              start: new Date(start).getTime(),
            });
          },
          1000),
    },

    end: {
      get() {
        return this.inputformat(this.goal.end);
      },
      set: _.debounce(
          function(end) {
            this.$emit('update-end', {
              goal: this.goal,
              end: new Date(end).getTime(),
            });
          },
          1000),
    },

    baseline: {
      get() {
        return this.goal.baseline;
      },
      set: _.debounce(
          function(baseline) {
            this.$emit('update-baseline', {
              goal: this.goal,
              baseline: baseline,
            });
          },
          1000),
    },

    target: {
      get() {
        return this.goal.target;
      },
      set: _.debounce(
          function(target) {
            this.$emit('update-target', {
              goal: this.goal,
              target: target,
            });
          },
          1000),
    },

    unit: {
      get() {
        return this.goal.unit
      },
      set: _.debounce(
          function(unit) {
            this.$emit('update-unit', {
              goal: this.goal,
              unit: unit,
            });
          },
          1000),
    },
  },

  template: `
    <div class="goal">
      <div class="name">{{ goal.name }} <button class="id" v-if="planning" v-on:click="copyGoalIdToClipboard()">{{ goal.id }}</button></div>
      <div v-show="planning">
        <button v-on:click="$emit('copy', goal)">copy</button>
        <button v-on:click="$emit('cut', goal)">cut</button>
        <button v-on:click="$emit('delete', goal)">delete</button>
      </div>
      <div v-if="tracking">
        <button v-on:click="$emit('increment', goal)" title="increment">increment</button>
        <button v-on:click="$emit('decrement', goal)" title="decrement">decrement</button>
      </div>
      <svg class="chart" preserveAspectRatio="none">
        <text
            class="status"
            text-anchor="middle"
            x="50%"
            y="20">{{ progressReport }}</text>
        <rect
            width="100%"
            height=2
            fill="lightgrey"
            y=28></rect>
        <rect
            class="current"
            :width="progressPercentBounded"
            height=6
            :fill="progressFillColor"
            y=26></rect>
        <rect
            class="today"
            width="0.5%"
            height=14
            :x="currentXPos"
            :y=22></rect>
        <text
            class="start"
            text-anchor="start"
            x=0
            y=20>{{ startDate }}</text>
        <text
            class="end"
            text-anchor="end"
            x="100%"
            y=20>{{ endDate }}</text>
        <text
          class="baseline"
          text-anchor="start"
          x=0
          y=48>{{ goal.baseline }}</text>
        <text
            class="velocity"
            text-anchor="middle"
            x="50%"
            y="48">{{ velocityReport }}</text>
        <text
          class="target"
          text-anchor="end"
          x="100%"
          y=48>{{ goal.target }} {{ goal.unit }}</text>
      </svg>
      <div>
        <span class="last-updated">{{ trajectory_last_updated }}</span>
      </div>
      <div class="edit" v-show="planning">
        <div><div>Name</div> <input type="text" v-model="name"></div>
        <div><div>Start</div> <input type="date" v-model="start"></div>
        <div><div>End</div> <input type="date" v-model="end"></div>
        <div><div>Baseline</div> <input type="number" v-model.number="baseline"></div>
        <div><div>Target</div> <input type="number" v-model.number="target"></div>
        <div><div>Current</div> <input type="number" v-model.number="current"> <div>{{ trajectory_last_updated }}</div></div>
        <div><div>Unit</div> <input type="text" v-model="unit"></div>
      </div>
    </div>
  `,
});

/**
 * Registers the <regular-goal> Vue component globally. This component renders a
 * regular goal.
 */
Vue.component('regular-goal', {
  mixins: [goalMixin, modeMixin],

  computed: {
    barColor() {
      let now = new Date().getTime();
      return this.goal.budgetRemainingProrated(now) > 0 ? 'rgb(136,187,77)' :
                                                          'rgb(187, 102, 77)'
    },

    barXPos() {
      let now = new Date().getTime();
      let b = this.goal.budgetRemainingProrated(now);
      if (b > 0) {
        return '0%';
      } else {
        return (100 - Math.max(0, Math.min(100, Math.abs((100 * b))))) + '%';
      }
    },

    barWidth() {
      let now = new Date().getTime();
      let b = this.goal.budgetRemainingProrated(now);
      return Math.max(0, Math.min(100, Math.abs((100 * b)))) + '%';
    },

    budgetClass() {
      let now = new Date().getTime();
      if (this.goal.budgetRemainingProrated(now) > 0) {
        return 'within-budget';
      } else {
        return 'out-of-budget';
      }
    },

    budgetRemaining() {
      let now = new Date().getTime();
      return (100 * this.goal.budgetRemainingProrated(now)).toFixed(0) + '%';
    },

    descriptionHtml() {
      let markdown = new SafeMarkdownRenderer();
      return markdown.render(this.goal.description);
    },

    partialData() {
      let now = new Date().getTime();
      if (this.goal.partialData(now)) {
        return '(partial data)';
      } else {
        return '';
      }
    },

    status() {
      let now = new Date().getTime();
      return `@ ${this.goal.value(now).toFixed(2)},
              targeting ${(this.goal.target).toFixed(2)} / ${this.goal.total} ${
          this.goal.unit}
              over ${this.goal.window}-day window`;
    },

    name: {
      get() {
        return this.goal.name;
      },
      set: _.debounce(
          function(name) {
            this.$emit('update-name', {
              goal: this.goal,
              name: name,
            });
          },
          1000),
    },

    description: {
      get() {
        return this.goal.description;
      },
      set: _.debounce(
          function(description) {
            this.$emit('update-description', {
              goal: this.goal,
              description: description,
            });
          },
          1000),
    },

    window: {
      get() {
        return this.goal.window;
      },
      set: _.debounce(
          function(window) {
            this.$emit('update-window', {
              goal: this.goal,
              window: window,
            });
          },
          1000),
    },

    target: {
      get() {
        return this.goal.target;
      },
      set: _.debounce(
          function(target) {
            this.$emit('update-target', {
              goal: this.goal,
              target: target,
            });
          },
          1000),
    },

    total: {
      get() {
        return this.goal.total;
      },
      set: _.debounce(
          function(total) {
            this.$emit('update-total', {
              goal: this.goal,
              total: total,
            });
          },
          1000),
    },

    unit: {
      get() {
        return this.goal.unit
      },
      set: _.debounce(
          function(unit) {
            this.$emit('update-unit', {
              goal: this.goal,
              unit: unit,
            });
          },
          1000),
    },
  },

  template: `
    <div class="regular-goal">
      <div :class="budgetClass">
        <div class="name">{{ goal.name }}<button class="id" v-if="planning" v-on:click="copyGoalIdToClipboard()">{{ goal.id }}</button></div>
        <div v-show="planning">
          <button v-on:click="$emit('copy', goal)">copy</button>
          <button v-on:click="$emit('cut', goal)">cut</button>
          <button v-on:click="$emit('delete', goal)">delete</button>
        </div>
        <div v-if="tracking">
          <button v-on:click="$emit('increment', goal)" title="increment">increment</button>
          <button v-on:click="$emit('decrement', goal)" title="decrement">decrement</button>
        </div>
        <div class="goal-description"><span v-html="descriptionHtml"></span></div>
        <div class="level">
          <span class="budget">{{ budgetRemaining }}</span>
          <span class="window"> of budget remaining {{ partialData }}</span>
          <span class="value">{{ status }}</span>
          <svg class="chart" preserveAspectRatio="none" style="height: 6px">
            <rect y="2" height="2" width="100%" fill="#ccc"></rect>
            <rect y="0" height="6" :x="barXPos" :width="barWidth" :fill="barColor"></rect>
          </svg>
        </div>
        <div>
          <span class="last-updated">{{ trajectory_last_updated }}</span>
        </div>
      </div>
      <div class="edit" v-if="planning">
        <div><div>Name</div> <input type="text" v-model="name"></div>
        <div><div>Description</div> <input type="text" v-model="description"></div>
        <div><div>Window</div> <input type="number" v-model.number="window"></div>
        <div><div>Target</div> <input type="number" v-model.number="target"></div>
        <div><div>Total</div> <input type="number" v-model.number="total"></div>
        <div><div>Current</div> <input type="number" v-model.number="current"> <div>{{ trajectory_last_updated }}</div></div>
        <div><div>Unit</div> <input type="text" v-model="unit"></div>
      </div>
    </div>
  `
});


/**
 * Registers the <budget-goal> Vue component globally. This component renders a
 * budget goal.
 */
 Vue.component('budget-goal', {
  mixins: [modeMixin],

  props: ['goal'],

  computed: {
    descriptionHtml() {
      let markdown = new SafeMarkdownRenderer();
      return markdown.render(this.goal.description);
    },

    name: {
      get() {
        return this.goal.name;
      },
      set: _.debounce(
          function(name) {
            this.$emit('update-name', {
              goal: this.goal,
              name: name,
            });
          },
          1000),
    },

    description: {
      get() {
        return this.goal.description;
      },
      set: _.debounce(
          function(description) {
            this.$emit('update-description', {
              goal: this.goal,
              description: description,
            });
          },
          1000),
    },

    target: {
      get() {
        return this.goal.target;
      },
      set: _.debounce(
          function(target) {
            this.$emit('update-target', {
              goal: this.goal,
              target: target,
            });
          },
          1000),
    },

    current: {
      get() {
        return this.goal.current;
      },
      set: _.debounce(
          function(current) {
            this.$emit('update-current', {
              goal: this.goal,
              current: current,
            });
          },
          1000),
    },

    barColor() {
      return this.goal.budgetRemaining > 0 ? 'rgb(136,187,77)' : 'rgb(187, 102, 77)'
    },

    barXPos() {
      if (this.goal.budgetRemaining) {
        return '0%';
      } else {
        return (100 - Math.max(0, Math.min(100, Math.abs((100 * this.goal.budgetRemaining))))) + '%';
      }
    },

    barWidth() {
      return Math.max(0, Math.min(100, Math.abs((100 * this.goal.budgetRemaining)))) + '%';
    },

    budgetClass() {
      if (this.goal.budgetRemaining > 0) {
        return 'within-budget';
      } else {
        return 'out-of-budget';
      }
    },

    budgetRemaining() {
      return (100 * this.goal.budgetRemaining ).toFixed(0) + '%';
    },
  },

  methods: {
    copyGoalIdToClipboard() {
      navigator.clipboard.writeText(this.goal.id);
    },
  },

  template: `
    <div class="budget-goal">
      <div :class="budgetClass">
        <div class="name">{{ goal.name }}<button class="id" v-if="planning" v-on:click="copyGoalIdToClipboard()">{{ goal.id }}</button></div>
        <div v-show="planning">
          <button v-on:click="$emit('copy', goal)">copy</button>
          <button v-on:click="$emit('cut', goal)">cut</button>
          <button v-on:click="$emit('delete', goal)">delete</button>
        </div>
        <div class="goal-description"><span v-html="descriptionHtml"></span></div>
        <div class="level">
          <span class="budget">{{ budgetRemaining }}</span>
          <span class="window"> of budget remaining</span>
          <svg class="chart" preserveAspectRatio="none" style="height: 24px">
            <rect y="2" height="2" width="100%" fill="#ccc"></rect>
            <rect y="0" height="6" :x="barXPos" :width="barWidth" :fill="barColor"></rect>
            <text
                class="status"
                text-anchor="middle"
                x="50%"
                y="22">
                  current: {{ (100 * goal.current).toFixed(1) }}%;
                  target: {{ (100 * goal.target).toFixed(1) }}%
            </text>
          </svg>
        </div>
        <div class="edit" v-if="planning">
          <div><div>Name</div> <input type="text" v-model="name"></div>
          <div><div>Description</div> <input type="text" v-model="description"></div>
          <div><div>Target</div> <input type="number" v-model.number="target"></div>
          <div><div>Current</div> <input type="number" v-model.number="current"></div>
        </div>
      </div>
    </div>
  `
});


/**
 * The main Vue instance that is driving the application.
 */
let vue = new Vue({
  mixins: [modeMixin],

  el: '#app',

  data: {
    /**
     * objectives holds all of the objectives fetched from Firestore.
     * objectives is considered immutable, all changes to an objective or its
     * goals should be made directly in Firestore, relying on Firestore pushing
     * such changes back to the client. See also: class Objective.
     * @type {Objective[]}
     */
    objectives: [],

    /**
     * user_id contains the ID of the Firebase user. If user_id is set, then
     * this means that a user is signed in and the client authenticated with
     * Firebase.
     * @type {string}
     */
    user_id: '',

    /**
     * loaded signals when the objectives have been fetched from Firestore for
     * the first time. This is a useful signal for the application to make
     * other parts of the user interface available in synchronization. This
     * prevents the user interface from loading piece by piece. Instead, the
     * user interface should load in logical chunks.
     * @type {boolean}
     */
    loaded: false,

    /**
     * clippedGoal may contain a goal that was copied/cut from some objective.
     */
    clippedGoal: null,
  },

  computed: {
    signedIn() {
      return this.user_id != '';
    },
  },

  methods: {
    /**
     * copyUserIdToClipboard sets the clipboard to the ID of the signed-in
     * user.
     */
    copyUserIdToClipboard() {
      navigator.clipboard.writeText(this.user_id);
    },

    /** createObjective adds a new objective to Firestore. */
    createObjective() {
      let objective = new Objective({
        id: uuidv4(),
        name: 'AA New objective',
        description: '',
        goals: [],
        regularGoals: [],
        budgetGoals: [],
      });
      firebase.firestore()
          .collection('users')
          .doc(this.user_id)
          .collection('objectives')
          .doc(objective.id)
          .withConverter(new ObjectiveConverter())
          .set(objective);
    },

    /**
     * listenToObjectives ensures that whenever any of the objectives changes
     * in Firestore, the objectives on the client application are refreshed;
     * Firestore is considered the source of truth.
     */
    listenToObjectives() {
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
              o.regularGoals = _.sortBy(o.regularGoals, ['name', 'id']);
              o.budgetGoals = _.sortBy(o.budgetGoals, ['name', 'id']);
              objectives.push(o);
            });
            this.objectives = _.sortBy(objectives, ['name', 'id']);
            this.loaded = true;
          });
    },

    /**
     * signIn authenticates the client using redirect flow. The result of this
     * operation is handled in listener to onAuthStateChanged.
     */
    signIn() {
      let provider = new firebase.auth.GoogleAuthProvider();
      firebase.auth().signInWithRedirect(provider);
    },

    /** view switches the user interface into viewing mode. */
    view() {
      this.mode = Mode.VIEW;
    },

    /** track switches the user interface into tracking mode. */
    track() {
      this.mode = Mode.TRACK;
    },

    /** plan switches the user interface into planning mode. */
    plan() {
      this.mode = Mode.PLAN;
    },

    /** copy puts a goal into the "clipboard" */
    copy(copyEvent) {
      this.clippedGoal = copyEvent;
    },

    /** cut puts a goal into the "clipboard" */
    cut(cutEvent) {
      this.clippedGoal = cutEvent;
    },

    /** paste moves the goal from "clipboard" into another objective */
    paste(toObjective) {
      if (!this.clippedGoal) {
        // The "clipboard" is empty.
        return;
      }

      let goalId = this.clippedGoal.goal.id;

      let from = firebase.firestore()
        .collection('users')
        .doc(this.user_id)
        .collection('objectives')
        .doc(this.clippedGoal.fromObjective.id);

      let to = firebase.firestore()
        .collection('users')
        .doc(this.user_id)
        .collection('objectives')
        .doc(toObjective.id);

      let prefix = '';
      if (this.clippedGoal.type == GoalType.ONE_OFF) {
        prefix = 'goals';
      } else if (this.clippedGoal.type == GoalType.REGULAR) {
        prefix = 'regular_goals';
      } else if (this.clippedGoal.type == GoalType.BUDGET) {
        prefix = 'budget_goals';
      } else {
        // This is a bug.
        throw `Error: unknown type ${this.clippedGoal.type}`;
      }

      if (this.clippedGoal.action == ClipboardAction.COPY) {
        firebase.firestore().runTransaction((tx) => {
          return tx.get(from).then((s) => {
            if (!s.exists) {
              throw 'objective does not exist';
            }
            let g = s.data()[prefix][goalId];
            if (!g) {
              throw `goal does not exist: ${goalId}`;
            }
        		let newGoalId = uuidv4();
            g.name = `${g.name} (copy)`;
            let add = {
              [`${prefix}.${newGoalId}`]: g,
            };
            tx.update(to, add);
          });
        }).then(() => {
          this.clippedGoal = null;
          console.log("Transaction successfully committed!");
        }).catch((error) => {
          console.log("Transaction failed: ", error);
        });
      } else if (this.clippedGoal.action == ClipboardAction.CUT) {
        if (this.clippedGoal.fromObjective.id == toObjective.id) {
          // Nothing to do; more importantly, without this check the goal would
          // be removed from the objective, leading to data loss.
          return;
        }

        firebase.firestore().runTransaction((tx) => {
          return tx.get(from).then((s) => {
            if (!s.exists) {
              throw 'objective does not exist';
            }
            let g = s.data()[prefix][goalId];
            if (!g) {
              throw 'goal does not exist';
            }
            let add = {
              [`${prefix}.${goalId}`]: g,
            };
            let remove = {
              [`${prefix}.${goalId}`]: firebase.firestore.FieldValue.delete(),
            };
            tx.update(to, add).update(from, remove);
          });
        }).then(() => {
          this.clippedGoal = null;
          console.log("Transaction successfully committed!");
        }).catch((error) => {
          console.log("Transaction failed: ", error);
        });
      } else {
        // This is a bug.
        throw `Error: unknown action ${this.clippedGoal.action}`;
      }
    },
  },

  template: `
    <div class="app">
      <button
          id="signin"
          v-show="!signedIn"
          v-on:click="signIn">
        Sign in with Google
      </button>
      <div class="toolbar" v-show="loaded">
        <button
            :disabled="viewing"
            v-on:click="view">
          View
        </button>
        <button
            :disabled="tracking"
            v-on:click="track">
          Track
        </button>
        <button
            :disabled="planning"
            v-on:click="plan">
          Plan
        </button>
        <button
            class="id"
            v-if="planning"
            v-on:click="copyUserIdToClipboard()">
          {{ user_id }}
        </button>
      </div>
      <div class="toolbar" v-show="planning">
        <button v-on:click="createObjective">Add objective</button>
      </div>
      <objective
          v-for="o in objectives"
          v-bind:objective="o"
          v-bind:user_id="user_id"
          v-bind:mode="mode"
          v-bind:key="o.id"
          v-on:copy="copy($event)"
          v-on:cut="cut($event)"
          v-on:paste="paste($event)">
      </objective>
      <div class="popup" v-if="clippedGoal">
        <em>"{{ clippedGoal.goal.name }}"</em> ready to paste.
      </div>
    </div>
  `
});

// Listen to the results of the sign-in flow. Once successfully authenticated,
// fetch the objectives from Firestore.
if (!testing) {
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      vue.user_id = user.uid;
      vue.listenToObjectives();
    }
  });
}
