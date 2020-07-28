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

  get progress() {
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
 
  render(containerSelector) {
    let svg = (
      d3.select(containerSelector)
        .append('svg')
        .attr('width', 400)
        .attr('height', 400));
 
    // Draw names
    (svg
      .selectAll('whatever')
        .data(this._goals)
      .enter()
        .append('text')
          .attr('y', (d, i) => (i+1) * 60)
          .text((d) => d.name)
    );

    // Draw progress bar wires
    (svg
      .selectAll('whatever')
        .data(this._goals)
      .enter()
        .append('rect')
          .attr('width', '100%')
          .attr('height', '6')
          .attr('fill', 'lightgrey')
          .attr('y', (d, i) => (i+1) * 60 + 20)
    );
 
    // Draw progress bars
    (svg
      .selectAll('whatever')
        .data(this._goals)
      .enter()
        .append('rect')
          .attr('width', (d) => `${100*d.progress}%`)
          .attr('height', '18')
          .attr('fill', 'darkgrey')
          .attr('y', (d, i) => (i+1) * 60 + 14)
    );
  }

}
