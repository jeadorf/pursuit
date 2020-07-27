"use strict"

let expect = chai.expect;

describe('goal', () => {

  it('is constructed with a name', () => {
    let name = 'Distance';
    let goal = new Goal({name});
    expect(goal.name).to.equal(name);
  });

  it('is constructed with an identifier', () => {
    let id = 'distance';
    let goal = new Goal({id});
    expect(goal.id).to.equal(id);
  });

  it('is constructed with a target', () => {
    let target = 3.14159;
    let goal = new Goal({target});
    expect(goal.target).to.equal(target);
  });

  it('is constructed with a baseline', () => {
    let baseline = 0.747;
    let goal = new Goal({baseline});
    expect(goal.baseline).to.equal(baseline);
  });

  it('is constructed with a start date', () => {
    let start = new Date();
    let goal = new Goal({start});
    expect(goal.start).to.equal(start);
  });

  it('is constructed with an end date', () => {
    let end = new Date();
    let goal = new Goal({end});
    expect(goal.end).to.equal(end);
  });

  it('has a target of one by default', () => {
    let goal = new Goal({});
    expect(goal.target).to.equal(1.0);
  });

  it('has a baseline of zero by default', () => {
    let goal = new Goal({});
    expect(goal.baseline).to.equal(0.0);
  });

  it('has a current value of zero by default', () => {
    let goal = new Goal({});
    expect(goal.current).to.equal(0.0);
  });

  it('has a current value that can be modified', () => {
    let goal = new Goal({});
    expect(goal.current).to.equal(0.0);
    goal.current = 25;
    expect(goal.current).to.equal(25);
  });

  it('has a completion percentage', () => {
    let goal = new Goal({});
    expect(goal.completion).to.equal(0.0);
  });

  it('has completion percentage depending on target, baseline, current', () => {
    let goal = new Goal({target: 1200, baseline: 200});
    expect(goal.completion).to.equal(0.0);
    goal.current = 600;
    expect(goal.completion).to.equal(0.4);
  });

  it('can be completed', () => {
    let goal = new Goal({target: 25});
    expect(goal.completion).to.equal(0.0);
    goal.current = 25;
    expect(goal.completion).to.equal(1.0);
  });

  it('supports ascending towards a target', () => {
    let goal = new Goal({target: 800, baseline: -200});
    expect(goal.completion).to.equal(0.0);
    goal.current = 200;
    expect(goal.completion).to.equal(0.4);
  });

  it('supports descending towards a target', () => {
    let goal = new Goal({target: -200, baseline: 800});
    expect(goal.completion).to.equal(0.0);
    goal.current = 600;
    expect(goal.completion).to.equal(0.2);
  });

});


describe('app', () => {

  it('can set goals', () => {
    let app = new App();
    let goals = [new Goal({}), new Goal({})]
    expect(app.goals).to.be.empty;

    app.goals = goals;

    expect(app.goals).to.have.lengthOf(2);
  });

  it('can render goals', () => {
    let app = new App();
    app.goals = [
      new Goal({
        name: 'Foo',
        target: 1200,
        baseline: 200,
      }),
      new Goal({
        name: 'Bar',
        target: 90,
        baseline: 20,
      }),
    ];
    let container = document.createElement('div');

    app.render(container);

    expect(container.innerHTML).to.have.string('Foo');
    expect(container.innerHTML).to.have.string('Bar');
  });

});
