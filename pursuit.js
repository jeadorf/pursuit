"use strict"

class Goal {

  constructor({id = "goal",
               name = "Goal",
               target = 1.0,
               baseline = 0.0,
               start = new Date(),
               end = new Date()}) {
    this._id = id;
    this._name = name;
    this._target = target;
    this._baseline = baseline;
    this._current = baseline;
    this._start = start;
    this._end = end;
  }

  get id() {
    return this._id;
  }

  get name() {
    return this._name;
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

  get completion() {
    return (this._current - this._baseline) / (this._target - this._baseline);
  }
}

class App {

  constructor() {
    this._goals = [];
  }

  get goals() {
    return this._goals;
  }

  set goals(value) {
    this._goals = value;
  }
 
  render(container) {
    let html = "<ul>";
    for (let g of this._goals) {
      html += (
`<li>${g.name} (target=${g.target},
                baseline=${g.baseline},
                current=${g.current},
                start=${g.start},
                end=${g.end})`);
    }
    html += "</ul>";
    container.innerHTML = html;
  }

}
