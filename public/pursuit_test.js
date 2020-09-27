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

"use strict"

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

  it('is not archived by default', () => {
    let goal = new Goal({});
    expect(goal.archived).to.equal(false);
  });

  it('has progress', () => {
    let goal = new Goal({
      start: 0,
      end: 10,
      target: 100,
      trajectory: (
        new Trajectory()
          .insert(0, 0)
          .insert(5, 12)),
    });
    expect(goal.progress).to.equal(0.12);
  });

  it('can be completed', () => {
    let goal = new Goal({
      start: 0,
      end: 10,
      target: 100,
      trajectory: (
        new Trajectory()
          .insert(0, 0)
          .insert(5, 100)),
    });

    expect(goal.progress).to.equal(1.0);
  });

  it('supports ascending towards a target', () => {
    let goal = new Goal({
      start: 0,
      end: 10,
      target: 800,
      trajectory: (
        new Trajectory()
          .insert(0, -200)
          .insert(5, 200)),
    });
    expect(goal.progress).to.equal(0.4);
  });

  it('supports descending towards a target', () => {
    let goal = new Goal({
      start: 0,
      end: 10,
      target: -200,
      trajectory: (
        new Trajectory()
          .insert(0, 800)
          .insert(5, 600)),
    });
    expect(goal.progress).to.equal(0.2);
  });

  it('reports days left', () => {
    let goal = new Goal({
      start: 0,
      end: 7.5 * DAY,
    });
    expect(goal.days_left(goal.start)).to.equal(7.5);
    expect(goal.days_left(0.5 * (goal.end - goal.start))).to.equal(3.75);
    expect(goal.days_left(goal.end)).to.equal(0.0);
  });

  it('never reports negative days left', () => {
    let goal = new Goal({
      start: 0,
      end: 3 * DAY,
    });
    expect(goal.days_left(goal.end + DAY)).to.equal(0.0);
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
      start: 5000,
      end: 15000,
      target: 120,
      trajectory: (
        new Trajectory()
          .insert(5000, 20)
          .insert(6000, 30)),
    });
    expect(goal.is_on_track(6000)).to.be.true;
    expect(goal.is_on_track(6001)).to.be.false;
  });

  it('compares progress against end date in the past', () => {
    let goal = new Goal({
      start: 5000,
      end: 15000,
      target: 120,
      trajectory: (
        new Trajectory()
          .insert(5000, 20)
          .insert(15000, 120)),
    });
    expect(goal.is_on_track(15000)).to.be.true;
    expect(goal.is_on_track(20000)).to.be.true;
  });

  it('can compute mean velocity', () => {
    let goal = new Goal({
      target: 300,
      start: 0,
      end: 1000,
      trajectory: (
        new Trajectory()
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

    trajectory.compact_head(DAY);
    
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
            archived: true,
            trajectory: [
              {date: 2490, value: 0},
              {date: 3622, value: 110},
            ],
          }
        }
      })
    };
    let expected = new Objective({
      id: '11616568-c5f8-4e3f-9bc1-1c432bd361c2',
      name: 'name',
      description: 'description',
      goals: [
        new Goal({
				  id: 'd66c24f7-a7fd-4760-95be-401dc7b53935',
          name: 'Shuttle Speed',
          target: 2300,
          start: 2490,
          end: 5439,
          archived: true,
          trajectory: (
            new Trajectory()
              .insert(2490, 0)
              .insert(3622, 110))
        })
      ]
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
    });

    expect(converter.fromFirestore(doc)).to.eql(expected);
  });
  
  it('can convert to Firestore', () => {
    let converter = new ObjectiveConverter();
    let objective = new Objective({
      id: '11616568-c5f8-4e3f-9bc1-1c432bd361c2',
      name: 'name',
      description: 'description',
      goals: [
        new Goal({
				  id: 'd66c24f7-a7fd-4760-95be-401dc7b53935',
          name: 'Shuttle Speed',
          unit: 'km/h',
          target: 2300,
          start: 2490,
          end: 5439,
          archived: true,
          trajectory: (
            new Trajectory()
              .insert(2490, 0)
              .insert(3622, 110)),
        })
      ]
    });
    let expected = {
      name: 'name',
      description: 'description',
      goals:
        {
				  ['d66c24f7-a7fd-4760-95be-401dc7b53935']: {
				    id: 'd66c24f7-a7fd-4760-95be-401dc7b53935',
            name: 'Shuttle Speed',
            unit: 'km/h',
            target: 2300,
            start: 2490,
            end: 5439,
            archived: true,
            trajectory: [
              {date: 2490, value: 0},
              {date: 3622, value: 110},
            ],
          }
        }
    };

    expect(converter.toFirestore(objective)).to.eql(expected);
  });
});


describe('model', () => {
  it('has no objectives initially', () => {
    let model = new Model();
    expect(model.objectives).to.be.empty;
  });

  it('has no user id initially', () => {
    let model = new Model();
    expect(model.user_id).to.be.null;
  });

  it('can set objectives', () => {
    let model = new Model();
    let objectives = [new Objective({}), new Objective({})]
    expect(model.objectives).to.be.empty;

    model.objectives = objectives;

    expect(model.objectives).to.have.lengthOf(2);
  });

  it('can set user id', () => {
    let model = new Model();
    expect(model.user_id).to.be.null;

    model.user_id = 'test-user';

    expect(model.user_id).to.equal('test-user');
  });
});


describe('view', () => {
  it('can render goals', () => {
    let app = new App();
    app.model.user_id = 'test-user';
    app.model.objectives = [
      new Objective({
        goals: [
          new Goal({
            name: 'Foo',
            unit: 'km/h',
            target: 1200,
          }),
          new Goal({
            name: 'Bar',
            unit: 'l/s',
            target: 90,
          }),
        ],
      }),
    ];

    app.view.render();

    let appText = document.querySelector('#app').innerHTML;
    expect(appText).to.have.string('Foo');
    expect(appText).to.have.string('Bar');
    expect(appText).to.have.string('km/h');
    expect(appText).to.have.string('l/s');
  });

  it('renders percentage complete', () => {
    let app = new App();
    app.model.user_id = 'test-user';
    app.model.objectives = [
      new Objective({
        goals: [
          new Goal({
            target: 1000,
            start: 0,
            end: 10,
            trajectory: (
              new Trajectory()
                .insert(0, 0)
                .insert(1, 202.3)),
          }),
          new Goal({
            target: 1000,
            start: 0,
            end: 10,
            trajectory: (
              new Trajectory()
                .insert(0, 0)
                .insert(1, 521.6))
          }),
        ],
      }),
    ];

    app.view.render();

    let appText = document.querySelector('#app').innerHTML;
    expect(appText).to.have.string('@ 20.2%');
    expect(appText).to.have.string('@ 52.2%');
  });

  it('renders days left', () => {
    let app = new App();
    app.model.user_id = 'test-user';
    let now = new Date().getTime();
    app.model.objectives = [
      new Objective({
        goals: [
          new Goal({
            start: now - 123456789,
            end: now + 1000 * 60 * 60 * 24 * 17,
          }),
          new Goal({
            start: now - 123456789,
            end: now + 1000 * 60 * 60 * 24 * 31,
          }),
        ],
      }),
    ];

    app.view.render();

    let appText = document.querySelector('#app').innerHTML;
    expect(appText).to.have.string('17 days left');
    expect(appText).to.have.string('31 days left');
  });

  it('renders goals in alphabetical order', () => {
    let app = new App();
    app.model.user_id = 'test-user';
    app.model.objectives = [
      new Objective({
        goals: [
          new Goal({
            name: 'Delta',
          }),
          new Goal({
            name: 'Beta',
          }),
          new Goal({
            name: 'Alpha',
          }),
          new Goal({
            name: 'Caesar',
          }),
        ]}),
    ];

    app.view.render();

    let appText = document.querySelector('#app').innerHTML;
    expect(appText.indexOf('Alpha')).to.be.below(appText.indexOf('Beta'));
    expect(appText.indexOf('Beta')).to.be.below(appText.indexOf('Caesar'));
    expect(appText.indexOf('Caesar')).to.be.below(appText.indexOf('Delta'));
  });

  it('renders objectives and goals exactly once', () => {
    let app = new App();
    app.model.user_id = 'test-user';
    app.model.objectives = [
      new Objective({
        name: 'Alpha',
        goals: [
          new Goal({
            name: 'Beta',
          }),
        ],
      }),
    ];

    // Run twice, because we expect the render() function to be idempotent.
    app.view.render();
    app.view.render();

    let alphas = document.querySelector('#app').innerHTML.match(/Alpha/g);
    let betas = document.querySelector('#app').innerHTML.match(/Beta/g);
    expect(alphas).to.have.lengthOf(1);
    expect(betas).to.have.lengthOf(1);
  });

  it('renders sign-in screen if not logged in', () => {
    let app = new App();

    app.view.render();

    let signIn = document.querySelector('#signin');
    expect(signIn.style.display).to.equal('block');
    expect(signIn.innerText).to.have.string('Sign in with Google');

    app.model.user_id = 'test-user';
    app.view.render();

    expect(signIn.style.display).to.be.empty;
    expect(signIn.innerText).to.have.string('Sign in with Google');
  });
});


describe('safe markdown renderer', () => {
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
    expect(html).to.equal('<p>this <a href="http://www.example.org/">link</a> abc.</p>\n');
  });

  it('does not render links with schema mailto', () => {
    let renderer = new SafeMarkdownRenderer();
    let html = renderer.render('this [link](mailto:bert@example.org/) abc.');
    expect(html).to.equal('<p>this <a>link</a> abc.</p>\n');
  });
});
