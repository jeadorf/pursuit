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
    let start = 31536000000;
    let goal = new Goal({start});
    expect(goal.start).to.equal(start);
  });

  it('is constructed with an end date', () => {
    let end = 31536000000;
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

  it('has progress', () => {
    let goal = new Goal({});
    expect(goal.progress).to.equal(0.0);
  });

  it('has progress depending on target, baseline, current', () => {
    let goal = new Goal({target: 1200, baseline: 200});
    expect(goal.progress).to.equal(0.0);
    goal.current = 600;
    expect(goal.progress).to.equal(0.4);
  });

  it('can be completed', () => {
    let goal = new Goal({target: 25});
    expect(goal.progress).to.equal(0.0);
    goal.current = 25;
    expect(goal.progress).to.equal(1.0);
  });

  it('supports ascending towards a target', () => {
    let goal = new Goal({target: 800, baseline: -200});
    expect(goal.progress).to.equal(0.0);
    goal.current = 200;
    expect(goal.progress).to.equal(0.4);
  });

  it('supports descending towards a target', () => {
    let goal = new Goal({target: -200, baseline: 800});
    expect(goal.progress).to.equal(0.0);
    goal.current = 600;
    expect(goal.progress).to.equal(0.2);
  });

  it('has time spent percentage', () => {
    let goal = new Goal({
      start: 637369200000,
      end: 958082400000,
    });
    expect(goal.time_spent(goal.start)).to.equal(0.0);
    expect(goal.time_spent(goal.end)).to.equal(1.0);
  });

  it('has 100% time spent if end date equals start date', () => {
    let goal = new Goal({
      start: 637369200000,
      end: 637369200000,
    });
    expect(goal.time_spent(goal.start)).to.equal(1.0);
    expect(goal.time_spent(goal.end)).to.equal(1.0);
  });

  it('can determine whether on track', () => {
    let goal = new Goal({
      start: 660006000000,
      end: 660783600000,
      target: 120,
      baseline: 20,
    });
    goal.current = 110;
    expect(goal.is_on_track(660697200000)).to.be.true;
    expect(goal.is_on_track(660783600000)).to.be.false;
  });

  it('can convert from Firestore', () => {
    let converter = new GoalConverter();
    let doc = {
      data: () => ({
        name: 'name',
        start: 1234,
        end: 5678,
        baseline: -20,
        target: 40,
        current: 10,
      })
    };
    let expected = new Goal({
      name: 'name',
      start: 1234,
      end: 5678,
      baseline: -20,
      target: 40,
      current: 10,
    });

    expect(converter.fromFirestore(doc)).to.eql(expected);
  });

  it('can convert to Firestore', () => {
    let converter = new GoalConverter();
    let goal = new Goal({
      name: 'name',
      start: 1234,
      end: 5678,
      baseline: -20,
      target: 40,
      current: 10,
    });
    let expected = {
      name: 'name',
      start: 1234,
      end: 5678,
      baseline: -20,
      target: 40,
      current: 10,
    };

    expect(converter.toFirestore(goal)).to.eql(expected);
  });

});


describe('app', () => {

  it('has no goals initially', () => {
    let app = new App();
    expect(app.goals).to.be.empty;
  });

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

    app.render();

    let appText = document.querySelector('#app').innerHTML;
    expect(appText).to.have.string('Foo');
    expect(appText).to.have.string('Bar');
  });
});

