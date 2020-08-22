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

  it('can convert from Firestore', () => {
    let converter = new ObjectiveConverter();
    let doc = {
      id: 'id',
      data: () => ({
        name: 'name',
        description: 'description',
        goals: [
          {
						id: 'd66c24f7-a7fd-4760-95be-401dc7b53935',
            name: 'Shuttle Speed',
            target: 2300,
            baseline: 0,
            current: 0,
            start: 2490,
            end: 5439
          }
        ]
      })
    };
    let expected = new Objective({
      id: 'id',
      name: 'name',
      description: 'description',
      goals: [
        new Goal({
				  id: 'd66c24f7-a7fd-4760-95be-401dc7b53935',
          name: 'Shuttle Speed',
          target: 2300,
          baseline: 0,
          current: 0,
          start: 2490,
          end: 5439
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
  
 
  // TODO add test case where goals is not defined in document

  it('can convert to Firestore', () => {
    let converter = new ObjectiveConverter();
    let objective = new Objective({
      id: 'id',
      name: 'name',
      description: 'description',
      goals: [
        new Goal({
				  id: 'd66c24f7-a7fd-4760-95be-401dc7b53935',
          name: 'Shuttle Speed',
          unit: 'km/h',
          target: 2300,
          baseline: 0,
          current: 0,
          start: 2490,
          end: 5439
        })
      ]
    });
    let expected = {
      name: 'name',
      description: 'description',
      goals: [
        {
				  id: 'd66c24f7-a7fd-4760-95be-401dc7b53935',
          name: 'Shuttle Speed',
          unit: 'km/h',
          target: 2300,
          baseline: 0,
          current: 0,
          start: 2490,
          end: 5439
        }
      ]
    };

    expect(converter.toFirestore(objective)).to.eql(expected);
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

  it('reports days left', () => {
    let goal = new Goal({
      start: 0,
      end: 7.5 * 24 * 60 * 60 * 1000,
    });
    expect(goal.days_left(goal.start)).to.equal(7.5);
    expect(goal.days_left(0.5 * (goal.end - goal.start))).to.equal(3.75);
    expect(goal.days_left(goal.end)).to.equal(0.0);
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
});


describe('app', () => {
  it('has no objectives initially', () => {
    let app = new App();
    expect(app.objectives).to.be.empty;
  });

  it('can set objectives', () => {
    let app = new App();
    let objectives = [new Objective({}), new Objective({})]
    expect(app.objectives).to.be.empty;

    app.objectives = objectives;

    expect(app.objectives).to.have.lengthOf(2);
  });

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
    app.objectives = [
      new Objective({
        goals: [
          new Goal({
            name: 'Foo',
            unit: 'km/h',
            target: 1200,
            baseline: 200,
          }),
          new Goal({
            name: 'Bar',
            unit: 'l/s',
            target: 90,
            baseline: 20,
          }),
        ],
      }),
    ];

    app.render();

    let appText = document.querySelector('#app').innerHTML;
    expect(appText).to.have.string('Foo');
    expect(appText).to.have.string('Bar');
    expect(appText).to.have.string('km/h');
    expect(appText).to.have.string('l/s');
  });

  it('renders percentage complete', () => {
    let app = new App();
    app.objectives = [
      new Objective({
        goals: [
          new Goal({
            target: 1000,
            current: 202.3,
          }),
          new Goal({
            target: 1000,
            current: 521.6,
          }),
        ],
      }),
    ];

    app.render();

    let appText = document.querySelector('#app').innerHTML;
    expect(appText).to.have.string('20.2% complete');
    expect(appText).to.have.string('52.2% complete');
  });

  it('renders days left', () => {
    let app = new App();
    let now = new Date().getTime();
    app.objectives = [
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

    app.render();

    let appText = document.querySelector('#app').innerHTML;
    expect(appText).to.have.string('17 days left');
    expect(appText).to.have.string('31 days left');
  });

  it('renders goals in alphabetical order', () => {
    let app = new App();
    app.objectives = [
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

    app.render();

    let appText = document.querySelector('#app').innerHTML;
    expect(appText.indexOf('Alpha')).to.be.below(appText.indexOf('Beta'));
    expect(appText.indexOf('Beta')).to.be.below(appText.indexOf('Caesar'));
    expect(appText.indexOf('Caesar')).to.be.below(appText.indexOf('Delta'));
  });

  it('renders objectives and goals exactly once', () => {
    let app = new App();
    app.objectives = [
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
    app.render();
    app.render();

    let alphas = document.querySelector('#app').innerHTML.match(/Alpha/g);
    let betas = document.querySelector('#app').innerHTML.match(/Beta/g);
    expect(alphas).to.have.lengthOf(1);
    expect(betas).to.have.lengthOf(1);
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

  it('will render http: link markdown', () => {
    let renderer = new SafeMarkdownRenderer();
    let html = renderer.render('this [link](http://www.example.org/) abc.');
    expect(html).to.equal('<p>this <a href="http://www.example.org/">link</a> abc.</p>\n');
  });

  it('will not render mailto: link markdown', () => {
    let renderer = new SafeMarkdownRenderer();
    let html = renderer.render('this [link](mailto:bert@example.org/) abc.');
    expect(html).to.equal('<p>this <a>link</a> abc.</p>\n');
  });
});
