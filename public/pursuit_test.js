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

let expect = chai.expect;


describe('objective', () => {
  it('is constructed with a name', () => {
    let name = 'Travel to the Moon';
    let objective = new Objective({name});
    expect(objective.name).to.equal(name);
  });

  it('is constructed with an identifier', () => {
    let id = 'moon-landing';
    let objective = new Objective({id});
    expect(objective.id).to.equal(id);
  });

  it('is constructed with a description', () => {
    let description = 'Land on the moon before 1970.';
    let objective = new Objective({description});
    expect(objective.description).to.equal(description);
  });

  it('is constructed with goals', () => {
    let goals = [new Goal({})];
    let objective = new Objective({goals});
    expect(objective.goals).to.equal(goals);
  });

  it('is constructed with regular goals', () => {
    let regularGoals = [new RegularGoal({})];
    let objective = new Objective({regularGoals});
    expect(objective.regularGoals).to.equal(regularGoals);
  });
});


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

  it('is constructed with a unit', () => {
    let unit = 'km';
    let goal = new Goal({unit});
    expect(goal.unit).to.equal(unit);
  });

  it('is constructed with a target', () => {
    let target = 3.14159;
    let goal = new Goal({target});
    expect(goal.target).to.equal(target);
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

  it('has a current progress of NaN by default', () => {
    let goal = new Goal({});
    expect(goal.progress).to.be.NaN;
  });

  it('has progress', () => {
    let goal = new Goal({
      start: 0,
      end: 10,
      target: 100,
      trajectory: (new Trajectory().insert(0, 0).insert(5, 12)),
    });
    expect(goal.progress).to.equal(0.12);
  });

  it('can be completed', () => {
    let goal = new Goal({
      start: 0,
      end: 10,
      target: 100,
      trajectory: (new Trajectory().insert(0, 0).insert(5, 100)),
    });

    expect(goal.progress).to.equal(1.0);
  });

  it('supports ascending towards a target', () => {
    let goal = new Goal({
      start: 0,
      end: 10,
      target: 800,
      trajectory: (new Trajectory().insert(0, -200).insert(5, 200)),
    });
    expect(goal.progress).to.equal(0.4);
  });

  it('supports descending towards a target', () => {
    let goal = new Goal({
      start: 0,
      end: 10,
      target: -200,
      trajectory: (new Trajectory().insert(0, 800).insert(5, 600)),
    });
    expect(goal.progress).to.equal(0.2);
  });

  it('reports relative progress when exactly on track', () => {
    let goal = new Goal({
      start: 0,
      end: 10,
      target: 100,
      trajectory: (new Trajectory().insert(0, 0).insert(5, 50)),
    });
    expect(goal.relativeProgress(5)).to.equal(1.0);
  });

  it('reports relative progress when 20% behind', () => {
    let goal = new Goal({
      start: 0,
      end: 10,
      target: 100,
      trajectory: (new Trajectory().insert(0, 0).insert(5, 40)),
    });
    expect(goal.relativeProgress(5)).to.equal(0.8);
  });

  it('reports relative progress when 20% ahead', () => {
    let goal = new Goal({
      start: 0,
      end: 10,
      target: 100,
      trajectory: (new Trajectory().insert(0, 0).insert(5, 60)),
    });
    expect(goal.relativeProgress(5)).to.equal(1.2);
  });

  it('reports relative progress as 100% before start date', () => {
    let goal = new Goal({
      start: 1,
      end: 10,
      target: 100,
      trajectory: (new Trajectory().insert(1, 0).insert(5, 60)),
    });
    expect(goal.relativeProgress(0)).to.equal(1.0);
  });

  it('reports relative progress as 100% when complete after end date', () => {
    let goal = new Goal({
      start: 1,
      end: 10,
      target: 100,
      trajectory: (new Trajectory().insert(1, 0).insert(9, 100)),
    });
    expect(goal.relativeProgress(11)).to.equal(1.0);
  });

  it('reports relative progress as 90% when incomplete after end date', () => {
    let goal = new Goal({
      start: 1,
      end: 10,
      target: 100,
      trajectory: (new Trajectory().insert(1, 0).insert(5, 90)),
    });
    expect(goal.relativeProgress(11)).to.equal(0.9);
  });

  it('reports days until start as zero for start date', () => {
    let goal = new Goal({
      start: 3 * DAY,
      end: 6 * DAY,
    });
    expect(goal.daysUntilStart(goal.start)).to.equal(0.0);
  });

  it('reports days until start from now until start of goal', () => {
    let goal = new Goal({
      start: 3 * DAY,
      end: 7 * DAY,
    });
    expect(goal.daysUntilStart(DAY)).to.equal(2);
  });

  it('reports days until start as negative for dates past start date', () => {
    let goal = new Goal({
      start: 3 * DAY,
      end: 7 * DAY,
    });
    expect(goal.daysUntilStart(goal.start + DAY)).to.equal(-1.0);
  });

  it('reports days until end as zero for end date', () => {
    let goal = new Goal({
      start: 0,
      end: 7.5 * DAY,
    });
    expect(goal.daysUntilEnd(goal.end)).to.equal(0.0);
  });

  it('reports days until end from now until end of goal', () => {
    let goal = new Goal({
      start: 3 * DAY,
      end: 7 * DAY,
    });
    expect(goal.daysUntilEnd(DAY)).to.equal(6);
  });

  it('reports days until end as negative for dates past end date', () => {
    let goal = new Goal({
      start: 0,
      end: 3 * DAY,
    });
    expect(goal.daysUntilEnd(goal.end + DAY)).to.equal(-1.0);
  });

  it('has time spent percentage', () => {
    let goal = new Goal({
      start: 637369200000,
      end: 958082400000,
    });
    expect(goal.timeSpent(goal.start)).to.equal(0.0);
    expect(goal.timeSpent(goal.end)).to.equal(1.0);
  });

  it('has 100% time spent if end date equals start date', () => {
    let goal = new Goal({
      start: 637369200000,
      end: 637369200000,
    });
    expect(goal.timeSpent(goal.start)).to.equal(1.0);
    expect(goal.timeSpent(goal.end)).to.equal(1.0);
  });

  it('can determine whether on track', () => {
    let goal = new Goal({
      start: 5000,
      end: 15000,
      target: 120,
      trajectory: (new Trajectory().insert(5000, 20).insert(6000, 30)),
    });
    expect(goal.isOnTrack(6000)).to.be.true;
    expect(goal.isOnTrack(6001)).to.be.false;
  });

  it('compares progress against end date in the past', () => {
    let goal = new Goal({
      start: 5000,
      end: 15000,
      target: 120,
      trajectory: (new Trajectory().insert(5000, 20).insert(15000, 120)),
    });
    expect(goal.isOnTrack(15000)).to.be.true;
    expect(goal.isOnTrack(20000)).to.be.true;
  });

  it('can compute mean velocity', () => {
    let goal = new Goal({
      target: 300,
      start: 0,
      end: 1000,
      trajectory: (new Trajectory()
                       .insert(0, 50)
                       .insert(100, 60)
                       .insert(500, 150)
                       .insert(1000, 300)),
    });

    expect(goal.velocity(100)).to.equal(0.1);
    expect(goal.velocity(500)).to.equal(0.2);
    expect(goal.velocity(1000)).to.equal(0.25);
  });
});


describe('regular goal', () => {
  it('is constructed with a name', () => {
    let name = 'Regular sleep';
    let goal = new RegularGoal({name});
    expect(goal.name).to.equal(name);
  });

  it('is constructed with an identifier', () => {
    let id = 'e156d27b-1182-433e-9ax3-f29c78b1a113';
    let goal = new RegularGoal({id});
    expect(goal.id).to.equal(id);
  });

  it('is constructed with a description', () => {
    let description = 'Get high-quality sleep on most days of the week.';
    let goal = new RegularGoal({description});
    expect(goal.description).to.equal(description);
  });

  it('is constructed with a window', () => {
    let window = 90;
    let goal = new RegularGoal({window});
    expect(goal.window).to.equal(window);
  });

  it('is constructed with a target', () => {
    let target = 0.7;
    let goal = new RegularGoal({target});
    expect(goal.target).to.equal(target);
  });

  it('is constructed with a total', () => {
    let total = 28;
    let goal = new RegularGoal({total});
    expect(goal.total).to.equal(total);
  });

  it('is constructed with a unit', () => {
    let unit = 'km';
    let goal = new RegularGoal({unit});
    expect(goal.unit).to.equal(unit);
  });

  it('has all budget remaining', () => {
    let goal = new RegularGoal({
      window: 10,
      target: 7.5,
      total: 10,
      trajectory: (new Trajectory().insert(0, 0).insert(10 * DAY, 10)),
    });
    expect(goal.budgetRemaining(10 * DAY)).to.be.approximately(1, 0.000001);
    expect(goal.value(10 * DAY)).to.be.approximately(10, 0.000001);
  });

  it('has 20% budget remaining', () => {
    let goal = new RegularGoal({
      window: 10,
      target: 7.5,
      total: 10,
      trajectory: (new Trajectory().insert(0, 0).insert(10 * DAY, 8)),
    });
    expect(goal.budgetRemaining(10 * DAY)).to.be.approximately(0.20, 0.000001);
    expect(goal.value(10 * DAY)).to.be.approximately(8, 0.000001);
  });

  it('has zero budget remaining', () => {
    let goal = new RegularGoal({
      window: 10,
      target: 7.5,
      total: 10,
      trajectory: (new Trajectory().insert(0, 0).insert(10 * DAY, 7.5)),
    });
    expect(goal.budgetRemaining(10 * DAY)).to.be.approximately(0, 0.000001);
    expect(goal.value(10 * DAY)).to.be.approximately(7.5, 0.000001);
  });

  it('has partial data up until window', () => {
    let goal = new RegularGoal({
      window: 10,
      target: 7.5,
      total: 10,
      trajectory: (new Trajectory().insert(0, 0))
    });
    expect(goal.partialData(10 * DAY - 1)).to.be.true;
    expect(goal.partialData(10 * DAY)).to.be.false;
  });

  it('has budget remaining prorated if only partial data available', () => {
    let goal = new RegularGoal({
      window: 28,
      target: 12,
      total: 20,
      trajectory: (new Trajectory().insert(14 * DAY, 0).insert(28 * DAY, 8)),
    });
    expect(goal.budgetRemainingProrated(28 * DAY))
        .to.be.approximately(0.50, 0.000001);
    expect(goal.value(28 * DAY)).to.be.approximately(8, 0.000001);
  });

  it('has NaN as remaining budget when trajectory is empty', () => {
    let goal = new RegularGoal({});
    expect(goal.budgetRemaining(10)).to.be.NaN;
  });

  it('has NaN as prorated remaining budget when trajectory is empty', () => {
    let goal = new RegularGoal({});
    expect(goal.budgetRemainingProrated(10)).to.be.NaN;
  });
});


describe('trajectory', () => {
  it('has length zero if empty', () => {
    let trajectory = new Trajectory();
    expect(trajectory.length).to.equal(0);
  });

  it('has length one after adding one value', () => {
    let trajectory = new Trajectory();

    trajectory.insert(660697200000, 123);

    expect(trajectory.length).to.equal(1);
  });

  it('has earliest value undefined if empty', () => {
    let trajectory = new Trajectory();

    expect(trajectory.earliest).to.be.undefined;
  });

  it('has latest value undefined if empty', () => {
    let trajectory = new Trajectory();

    expect(trajectory.latest).to.be.undefined;
  });


  it('has earliest value', () => {
    let trajectory = new Trajectory();

    trajectory.insert(0, 12);
    trajectory.insert(1, 18);
    trajectory.insert(2, 24);

    expect(trajectory.earliest.date).to.equal(0);
    expect(trajectory.earliest.value).to.equal(12);
  });

  it('has latest value', () => {
    let trajectory = new Trajectory();

    trajectory.insert(0, 12);
    trajectory.insert(1, 18);
    trajectory.insert(2, 24);

    expect(trajectory.latest.date).to.equal(2);
    expect(trajectory.latest.value).to.equal(24);
  });

  it('replaces values', () => {
    let trajectory = new Trajectory();
    let date = 660697200000;

    trajectory.insert(date, 123);
    trajectory.insert(date, 246);

    expect(trajectory.latest.date).to.equal(date);
    expect(trajectory.latest.value).to.equal(246);
  });

  it('removes values', () => {
    let trajectory = new Trajectory();
    trajectory.insert(314, 123);
    trajectory.insert(144, 666);
    expect(trajectory.length).to.equal(2);

    trajectory.remove(314);

    expect(trajectory.length).to.equal(1);
    expect(trajectory.at(144)).to.equal(666);
    expect(trajectory.at(314)).to.equal(666);
  });

  it('can compact timeline', () => {
    let trajectory = new Trajectory()
                         .insert(0, 10)
                         .insert(DAY, 12)
                         .insert(DAY + 1, 24)
                         .insert(DAY + HOUR, 36)
                         .insert(2 * DAY + 1, 48)
    expect(trajectory.length).to.equal(5);

    trajectory.compactHead(DAY);

    expect(trajectory.at(0)).to.equal(10);
    expect(trajectory.at(DAY)).to.equal(12);
    expect(trajectory.at(2 * DAY + 1)).to.equal(48);
    expect(trajectory.length).to.equal(3);
  });

  it('returns value at given time', () => {
    let trajectory = new Trajectory();

    trajectory.insert(0, 12);
    trajectory.insert(1, 18);
    trajectory.insert(2, 24);

    expect(trajectory.at(0)).to.equal(12);
    expect(trajectory.at(1)).to.equal(18);
    expect(trajectory.at(2)).to.equal(24);
  });

  it('interpolates at given time', () => {
    let trajectory = new Trajectory();

    trajectory.insert(0, 0);
    trajectory.insert(4, 100);

    expect(trajectory.at(1)).to.equal(25);
    expect(trajectory.at(2)).to.equal(50);
    expect(trajectory.at(3)).to.equal(75);
  });

  it('extrapolates on the left', () => {
    let trajectory = new Trajectory();

    trajectory.insert(0, 0);
    trajectory.insert(2, 100);

    expect(trajectory.at(-1)).to.equal(0);
  });

  it('extrapolates on the right', () => {
    let trajectory = new Trajectory();

    trajectory.insert(0, 0);
    trajectory.insert(2, 100);

    expect(trajectory.at(3)).to.equal(100);
  });

  it('reports mean velocity', () => {
    let trajectory = new Trajectory();

    trajectory.insert(31, 10);
    trajectory.insert(41, 200);

    expect(trajectory.velocity(31, 41)).to.equal(19);
  });

  it('reports mean velocity over past 7 days', () => {
    let trajectory = new Trajectory();

    trajectory.insert(31, 10);
    trajectory.insert(34, 130);
    trajectory.insert(41, 200);

    expect(trajectory.velocity(34, 41)).to.equal(10);
  });

  it('reports mean velocity over past 30 days', () => {
    let trajectory = new Trajectory();

    trajectory.insert(11, 20);
    trajectory.insert(31, 10);
    trajectory.insert(34, 130);
    trajectory.insert(41, 200);

    expect(trajectory.velocity(11, 41)).to.equal(6);
  });
});


describe('objective converter', () => {
  it('can convert from Firestore', () => {
    let converter = new ObjectiveConverter();
    let doc = {
      id: '11616568-c5f8-4e3f-9bc1-1c432bd361c2',
      data: () => ({
        name: 'name',
        description: 'description',
        goals: {
          'd66c24f7-a7fd-4760-95be-401dc7b53935': {
            name: 'Shuttle Speed',
            target: 2300,
            start: 2490,
            end: 5439,
            trajectory: [
              {date: 2490, value: 0},
              {date: 3622, value: 110},
            ],
          }
        },
        regular_goals: {
          'e156d27b-1182-433e-9ax3-f29c78b1a113': {
            name: 'name',
            description: 'description',
            unit: 'unit',
            window: 10,
            target: 0.75,
            total: 10,
            trajectory: [
              {date: 2490, value: 0},
              {date: 3622, value: 110},
            ],
          },
        },
      })
    };
    let expected = new Objective({
      id: '11616568-c5f8-4e3f-9bc1-1c432bd361c2',
      name: 'name',
      description: 'description',
      goals: [new Goal({
        id: 'd66c24f7-a7fd-4760-95be-401dc7b53935',
        name: 'Shuttle Speed',
        target: 2300,
        start: 2490,
        end: 5439,
        trajectory: (new Trajectory().insert(2490, 0).insert(3622, 110))
      })],
      regularGoals: [
        new RegularGoal({
          id: 'e156d27b-1182-433e-9ax3-f29c78b1a113',
          name: 'name',
          description: 'description',
          unit: 'unit',
          window: 10,
          target: 0.75,
          total: 10,
          trajectory: (new Trajectory().insert(2490, 0).insert(3622, 110))
        }),
      ],
    });

    expect(converter.fromFirestore(doc)).to.eql(expected);
  });

  it('can convert objectives without goals from Firestore', () => {
    let converter = new ObjectiveConverter();
    let doc = {
      id: 'id',
      data: () => ({
        name: 'name',
        description: 'description',
      })
    };
    let expected = new Objective({
      id: 'id',
      name: 'name',
      description: 'description',
      goals: [],
      regularGoals: [],
    });

    expect(converter.fromFirestore(doc)).to.eql(expected);
  });

  it('can convert to Firestore', () => {
    let converter = new ObjectiveConverter();
    let objective = new Objective({
      id: '11616568-c5f8-4e3f-9bc1-1c432bd361c2',
      name: 'name',
      description: 'description',
      goals: [new Goal({
        id: 'd66c24f7-a7fd-4760-95be-401dc7b53935',
        name: 'Shuttle Speed',
        unit: 'km/h',
        target: 2300,
        start: 2490,
        end: 5439,
        trajectory: (new Trajectory().insert(2490, 0).insert(3622, 110)),
      })],
      regularGoals: [
        new RegularGoal({
          id: 'e156d27b-1182-433e-9ax3-f29c78b1a113',
          name: 'name',
          description: 'description',
          unit: 'unit',
          window: 10,
          target: 0.75,
          total: 10,
          trajectory: (new Trajectory().insert(0, 0).insert(10, 10)),
        }),
      ],
    });
    let expected = {
      name: 'name',
      description: 'description',
      goals: {
        ['d66c24f7-a7fd-4760-95be-401dc7b53935']: {
          id: 'd66c24f7-a7fd-4760-95be-401dc7b53935',
          name: 'Shuttle Speed',
          unit: 'km/h',
          target: 2300,
          start: 2490,
          end: 5439,
          trajectory: [
            {date: 2490, value: 0},
            {date: 3622, value: 110},
          ],
        }
      },
      regular_goals: {
        ['e156d27b-1182-433e-9ax3-f29c78b1a113']: {
          id: 'e156d27b-1182-433e-9ax3-f29c78b1a113',
          name: 'name',
          description: 'description',
          unit: 'unit',
          window: 10,
          target: 0.75,
          total: 10,
          trajectory: [
            {date: 0, value: 0},
            {date: 10, value: 10},
          ],
        }
      },
    };

    expect(converter.toFirestore(objective)).to.eql(expected);
  });
});

describe('velocity report', () => {
  it('shows 30d-velocity in unit / day', () => {
    let goal = new Goal({
      start: 0,
      end: 60 * DAY,
      baseline: 0,
      target: 180,
      unit: 'sessions',
      trajectory: (new Trajectory().insert(0, 0).insert(30 * DAY, 135))
    });
    let velocity = new VelocityReport();
    expect(velocity.report(goal, 30 * DAY))
        .to.be.equal(
            '30d: 4.5 sessions per day; now need 1.5 sessions per day');
  });

  it('shows 30d-velocity in unit / week', () => {
    let goal = new Goal({
      start: 0,
      end: 60 * DAY,
      baseline: 0,
      target: 30,
      unit: 'sessions',
      trajectory: (new Trajectory().insert(0, 0).insert(35 * DAY, 20))
    });
    let velocity = new VelocityReport();
    expect(velocity.report(goal, 5 * 7 * DAY))
        .to.be.equal(
            '30d: 4.0 sessions per week; now need 2.8 sessions per week');
  });

  it('shows 30d-velocity in unit / month', () => {
    let goal = new Goal({
      start: 0,
      end: 180 * DAY,
      baseline: 0,
      target: 12,
      unit: 'sessions',
      trajectory: (new Trajectory().insert(0, 0).insert(90 * DAY, 9))
    });
    let velocity = new VelocityReport();
    expect(velocity.report(goal, 90 * DAY))
        .to.be.equal(
            '30d: 3.0 sessions per month; now need 1.0 sessions per month');
  });
});

describe('progress report', () => {
  it('chooses green if relative progress is 100%', () => {
    let goal = new Goal({
      start: 0,
      end: 10,
      baseline: 0,
      target: 100,
      trajectory: (new Trajectory().insert(0, 0).insert(3, 30))
    });
    let progressReport = new ProgressReport();
    expect(progressReport.progressFillColor(goal, 3))
        .to.be.equal('rgb(136,187,77)');
  });

  it('chooses green if relative progress is greater than 100%', () => {
    let goal = new Goal({
      start: 0,
      end: 10,
      baseline: 0,
      target: 100,
      trajectory: (new Trajectory().insert(0, 0).insert(3, 60))
    });
    let progressReport = new ProgressReport();
    expect(progressReport.progressFillColor(goal, 3))
        .to.be.equal('rgb(136,187,77)');
  });

  it('chooses red if relative progress is 0%', () => {
    let goal = new Goal({
      start: 0,
      end: 10,
      baseline: 0,
      target: 100,
      trajectory: (new Trajectory().insert(0, 0))
    });
    let progressReport = new ProgressReport();
    expect(progressReport.progressFillColor(goal, 3))
        .to.be.equal('rgb(187,102,77)');
  });
});

describe('safe markdown renderer', () => {
  it('can render empty markdown', () => {
    let renderer = new SafeMarkdownRenderer();
    let html = renderer.render('');
    expect(html).to.equal('');
  });

  it('can render null markdown', () => {
    let renderer = new SafeMarkdownRenderer();
    let html = renderer.render(null);
    expect(html).to.equal('');
  });

  it('can render bold markdown', () => {
    let renderer = new SafeMarkdownRenderer();
    let html = renderer.render('this **bold** abc.');
    expect(html).to.equal('<p>this <strong>bold</strong> abc.</p>\n');
  });

  it('can render italic markdown', () => {
    let renderer = new SafeMarkdownRenderer();
    let html = renderer.render('this *italic* abc.');
    expect(html).to.equal('<p>this <em>italic</em> abc.</p>\n');
  });

  it('can render code markdown', () => {
    let renderer = new SafeMarkdownRenderer();
    let html = renderer.render('this `code` abc.');
    expect(html).to.equal('<p>this <code>code</code> abc.</p>\n');
  });

  it('renders lists', () => {
    let renderer = new SafeMarkdownRenderer();
    let html = renderer.render('this <ul><li>code</li></ul> abc.');
    expect(html).to.equal('<p>this </p><ul><li>code</li></ul> abc.<p></p>\n');
  });

  it('renders links with schema http', () => {
    let renderer = new SafeMarkdownRenderer();
    let html = renderer.render('this [link](http://www.example.org/) abc.');
    expect(html).to.equal(
        '<p>this <a href="http://www.example.org/">link</a> abc.</p>\n');
  });

  it('does not render links with schema mailto', () => {
    let renderer = new SafeMarkdownRenderer();
    let html = renderer.render('this [link](mailto:bert@example.org/) abc.');
    expect(html).to.equal('<p>this <a>link</a> abc.</p>\n');
  });
});

describe('objective component', () => {
  let c = null;

  beforeEach(() => {
    c = new Vue({
      el: document.createElement('div'),
      data: {
        objective: new Objective({}),
      },
      methods: {
        text() {
          return this.$el.innerText;
        }
      },
      template: `<objective v-bind:objective='objective'></objective>`
    });
  });

  it('shows name to user', async () => {
    let name = 'one giant leap';
    let objective = new Objective({name});

    await c.$nextTick();
    expect(c.text()).not.to.contain(name);
    c.objective = objective;
    await c.$nextTick();
    expect(c.text()).to.contain(name);
  });

  it('shows description to user', async () => {
    let description = 'one giant leap';
    let objective = new Objective({description});

    await c.$nextTick();
    expect(c.text()).not.to.contain(description);
    c.objective = objective;
    await c.$nextTick();
    expect(c.text()).to.contain(description);
  });

  it('shows goal to user', async () => {
    let goalName = 'find a rainbow';
    let goal = new Goal({
      name: goalName,
      start: 0,
      end: 10,
      baseline: 0,
      target: 100,
      trajectory: (new Trajectory().insert(0, 0))
    });
    let objective = new Objective({goals: [goal]});

    await c.$nextTick();
    expect(c.text()).not.to.contain(goalName);
    c.objective = objective;
    await c.$nextTick();
    expect(c.text()).to.contain(goalName);
  });

  it('shows regular goal to user', async () => {
    let goalName = 'find a rainbow';
    let goal = new RegularGoal({
      name: goalName,
      window: 10,
      target: 0.75,
      total: 10,
      trajectory: (new Trajectory().insert(0, 0).insert(10, 10)),
    });
    let objective = new Objective({regularGoals: [goal]});

    await c.$nextTick();
    expect(c.text()).not.to.contain(goalName);
    c.objective = objective;
    await c.$nextTick();
    expect(c.text()).to.contain(goalName);
  });
});

describe('goal component', () => {
  let c = null;

  beforeEach(() => {
    c = new Vue({
      el: document.createElement('div'),
      data: {
        goal: new Goal({}),
        mode: 'view',
        locale: 'de-CH',
        timezone: 'Europe/Zurich',
      },
      methods: {
        text() {
          return this.$el.innerText;
        }
      },
      template:
          `<goal v-bind:goal='goal' v-bind:mode='mode' v-bind:locale='locale' v-bind:timezone='timezone'></goal>`
    });
  });

  it('shows name to user', async () => {
    let name = 'one giant leap';
    let goal = new Goal({name});

    await c.$nextTick();
    expect(c.text()).not.to.contain(name);
    c.goal = goal;
    await c.$nextTick();
    expect(c.text()).to.contain(name);
  });

  it('shows start date in local timezone to user', async () => {
    let start = new Date(1634860022344);
    let goal = new Goal({start});

    c.goal = goal;
    c.locale = 'de-CH';
    c.timezone = 'Europe/Zurich';
    await c.$nextTick();
    expect(c.text()).not.to.contain('21.10.2021');
    expect(c.text()).to.contain('22.10.2021');

    c.locale = 'en-US';
    c.timezone = 'America/Los_Angeles';
    await c.$nextTick();
    expect(c.text()).to.contain('10/21/2021');
    expect(c.text()).not.to.contain('10/22/2021');
  });

  it('shows end date in local timezone to user', async () => {
    let end = new Date(1634860022344);
    let goal = new Goal({end});

    c.goal = goal;
    c.locale = 'de-CH';
    c.timezone = 'Europe/Zurich';
    await c.$nextTick();
    expect(c.text()).not.to.contain('21.10.2021');
    expect(c.text()).to.contain('22.10.2021');

    c.locale = 'en-US';
    c.timezone = 'America/Los_Angeles';
    await c.$nextTick();
    expect(c.text()).to.contain('10/21/2021');
    expect(c.text()).not.to.contain('10/22/2021');
  });

  it('allows user to increment or decrement when tracking', async () => {
    c.mode = 'track';
    await c.$nextTick();
    expect(c.text()).to.contain('increment');
    expect(c.text()).to.contain('decrement');
  });

  it('does not allow user to increment or decrement when viewing', async () => {
    c.mode = 'view';
    await c.$nextTick();
    expect(c.text()).to.not.contain('increment');
    expect(c.text()).to.not.contain('decrement');
  });

  it('does not allow user to increment or decrement when planning',
     async () => {
       c.mode = 'plan';
       await c.$nextTick();
       expect(c.text()).to.not.contain('increment');
       expect(c.text()).to.not.contain('decrement');
     });

  it('shows user the id when planning', async () => {
    let id = '1234567890';
    let goal = new Goal({id});
    c.mode = 'plan';

    c.goal = goal;

    await c.$nextTick();
    expect(c.text()).to.contain(id);
  });

  it('does not show the id to user when viewing', async () => {
    let id = '1234567890';
    let goal = new Goal({id});
    c.mode = 'view';

    c.goal = goal;

    await c.$nextTick();
    expect(c.text()).not.to.contain(id);
  });

  it('does not show the id to user when tracking', async () => {
    let id = '1234567890';
    let goal = new Goal({id});
    c.mode = 'track';

    c.goal = goal;

    await c.$nextTick();
    expect(c.text()).not.to.contain(id);
  });
});

describe('regular goal component', () => {
  let c = null;

  beforeEach(() => {
    c = new Vue({
      el: document.createElement('div'),
      data: {
        goal: new RegularGoal({}),
        mode: 'view',
      },
      methods: {
        text() {
          return this.$el.innerText;
        }
      },
      template:
          `<regular-goal v-bind:goal='goal' v-bind:mode='mode'></regular-goal>`
    });
  });

  it('shows name to user', async () => {
    let name = 'squat jump';
    let goal = new RegularGoal({name});

    await c.$nextTick();
    expect(c.text()).not.to.contain(name);
    c.goal = goal;
    await c.$nextTick();
    expect(c.text()).to.contain(name);
  });

  it('shows description to user', async () => {
    let description = 'one giant leap';
    let goal = new RegularGoal({description});

    await c.$nextTick();
    expect(c.text()).not.to.contain(description);
    c.goal = goal;
    await c.$nextTick();
    expect(c.text()).to.contain(description);
  });

  it('allows user to increment or decrement when tracking', async () => {
    c.mode = 'track';
    await c.$nextTick();
    expect(c.text()).to.contain('increment');
    expect(c.text()).to.contain('decrement');
  });

  it('does not allow user to increment or decrement when viewing', async () => {
    c.mode = 'view';
    await c.$nextTick();
    expect(c.text()).to.not.contain('increment');
    expect(c.text()).to.not.contain('decrement');
  });

  it('does not allow user to increment or decrement when planning',
     async () => {
       c.mode = 'plan';
       await c.$nextTick();
       expect(c.text()).to.not.contain('increment');
       expect(c.text()).to.not.contain('decrement');
     });

  it('shows user the id when planning', async () => {
    let id = '1234567890';
    let goal = new RegularGoal({id});
    c.mode = 'plan';

    c.goal = goal;

    await c.$nextTick();
    expect(c.text()).to.contain(id);
  });

  it('does not show the id to user when viewing', async () => {
    let id = '1234567890';
    let goal = new RegularGoal({id});
    c.mode = 'view';

    c.goal = goal;

    await c.$nextTick();
    expect(c.text()).not.to.contain(id);
  });

  it('does not show the id to user when tracking', async () => {
    let id = '1234567890';
    let goal = new RegularGoal({id});
    c.mode = 'track';

    c.goal = goal;

    await c.$nextTick();
    expect(c.text()).not.to.contain(id);
  });

  it('indicates to user if data is only partially available', async () => {
    let now = new Date().getTime();
    c.goal = new RegularGoal({
      window: 2,
      total: 2,
      target: 1,
      trajectory: (new Trajectory().insert(now - DAY, 0).insert(now, 1)),
    });

    await c.$nextTick();
    expect(c.text()).to.contain('budget remaining (partial data)');

    c.goal = new RegularGoal({
      window: 2,
      total: 2,
      target: 1,
      trajectory: (new Trajectory().insert(now - 2 * DAY, 0).insert(now, 1)),
    });

    await c.$nextTick();
    expect(c.text()).not.to.contain('budget remaining (partial data)');
  });
});
