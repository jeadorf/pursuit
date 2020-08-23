'use strict'

class Objective {
  constructor({id, name, description, goals}) {
    this._id = id;
    this._name = name;
    this._description = description;
    this._goals = goals;
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
}


class Goal {
  constructor({id,
               name,
               unit = '',
               target = 1.0,
               baseline = 0.0,
               current = null,
               start = 0,
               end = 0}) {
    this._id = id;
    this._name = name;
    this._unit = unit;
    this._target = target;
    this._baseline = baseline;
    this._current = current ?? baseline;
    this._start = start;
    this._end = end;
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

  time_spent(by_date) {
    let total = this._end - this._start;
    let spent = by_date - this._start;
    return total == 0 ? 1.0 : spent / total;
  }

  days_left(by_date) {
    let day = 24 * 60 * 60 * 1000;
    return (this.end - by_date) / day;
  }

  is_on_track(by_date) {
    return this.progress >= this.time_spent(by_date);
  }
}


class ObjectiveConverter {
  toFirestore(objective) {
    return {
      name: objective.name,
      description: objective.description,
      goals: objective.goals.map((g) => (
        {
          id: g.id,
          name: g.name,
          unit: g.unit,
          start: g.start,
          end: g.end,
          baseline: g.baseline,
          target: g.target,
          current: g.current,
        })),
    };
  }

  fromFirestore(snapshot, options) {
    const objective = snapshot.data(options);

    let goals = [];
    for (let id in objective.goals) {
      let g = objective.goals[id];
      goals.push(new Goal({
        id: id,
        name: g.name,
        unit: g.unit,
        start: g.start,
        end: g.end,
        baseline: g.baseline,
        target: g.target,
        current: g.current,
      }));
    }

    return new Objective({
      id: snapshot.id,
      name: objective.name,
      description: objective.description,
      goals: goals,
    });
  }
}


class SafeMarkdownRenderer {
  render(markdown) {
    let rawHtml = marked(markdown);
    return sanitizeHtml(rawHtml, {
      allowedTags: [
        'a', 'p', 'code', 'em', 'strong'
      ],
      allowedAttributes: {
        'a': ['href'],
        'p': [],
        'code': [],
        'em': [],
        'strong': [],
      },
      allowedSchemesByTag: {
        'a': [ 'http', 'https', ],
      },
    });
  }
}


class App {
  constructor() {
    this._objectives = [];
  }

  get objectives() {
    return this._objectives;
  }

  set objectives(value) {
    this._objectives = value;
  }

  signInWithGoogle() {
    let provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithRedirect(provider);
  }

  run() {
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        this._uid = user.uid;
        this.listenToObjectives();
      } else {
        let signIn = document.querySelector('#signin');
        signIn.style.display = 'block';
        let signInLink = document.createElement('a');
        signInLink.href = '#';
        signInLink.innerText = 'Sign in with Google';
        signInLink.onclick = () => this.signInWithGoogle();
        signIn.appendChild(signInLink);
      }
    });
  }

  listenToObjectives() {
    firebase.firestore()
      .collection('users')
      .doc(this._uid)
      .collection('objectives')
      .withConverter(new ObjectiveConverter())
      .onSnapshot((snapshot) => {
        let objectives = [];
        snapshot.forEach((d) => {
          objectives.push(d.data());
        });
        this.objectives = objectives;
        this.render();
      });
  }

  updateGoal(goalId, current) {
    let objectiveId = null;
    for (let o of this.objectives) {
      for (let g of o.goals) {
        if (g.id == goalId) {
          objectiveId = o.id;
        }
      }
    }

    firebase.firestore()
      .collection('users')
      .doc(this._uid)
      .collection('objectives')
      .doc(objectiveId)
      .update({
        [`goals.${goalId}.current`]: current
      });
  }

  render() {
    // Just clearing out everything leads to simpler code as we only need to
    // care about the enter selection in d3. Only when this becomes a
    // noticeable speed issue is it worthwhile to minimize DOM changes by
    // treating enter and update selections differently.
    document.querySelector('#app').innerHTML = '';

    d3.select('#app')
      .style('display', 'flex')
		  .selectAll('div.objective')
			.data(this.objectives)
      .enter()
      .append('div')
      .attr('class', 'objective')
      .call((n) => this._renderObjective(n));
  }

  _renderObjective(node) {
    node.append('div')
      .attr('class', 'objective-name')
      .text((o) => o.name);

    let markdown = new SafeMarkdownRenderer();
    node.append('div')
	    .attr('class', 'objective-description')
      .html((o) => markdown.render(o.description ?? ''));

	  let byName = (a, b) => (
      a.name > b.name ? 1 : a.name < b.name ? -1 : 0
    );
    node.selectAll('div.goal')
      .data((o) => o.goals.sort(byName))
      .enter()
      .append('div')
      .attr('class', 'goal')
      .call((n) => this._renderGoal(n));
  }

  _renderGoal(node) {
    let svg =
      node.append('svg')
        .attr('class', 'chart')
        .attr('viewBox', `0 0 100% 100`);

    // Draw names
		svg.append('text')
      .attr('class', 'name')
      .attr('x', 0)
      .attr('y', 20)
      .text((g) => g.name);

    // Draw progress
		svg.append('text')
      .attr('class', 'progress')
      .attr('text-anchor', 'middle')
      .attr('x', '50%')
      .attr('y', 80)
      .text((g) => `${(100 * g.progress).toFixed(1)}% complete`);

    // Draw time left
    let now = new Date().getTime();
		svg.append('text')
      .attr('class', 'days-left')
      .attr('text-anchor', 'middle')
      .attr('x', '50%')
      .attr('y', 40)
      .text((g) => `${g.days_left(now).toFixed(0)} days left`);

    // Draw progress bar wires
    svg.append('rect')
      .attr('width', '100%')
      .attr('height', 6)
      .attr('fill', 'lightgrey')
      .attr('y', 52);

   // Draw progress bars
   svg.append('rect')
     .attr('width', (g) => `${100 * g.progress}%`)
     .attr('height', 18)
     .attr('class', (g) => (g.is_on_track(now)
                              ? 'current ontrack'
                              : 'current offtrack'))
     .attr('y', 46);

   // Draw current date
   svg.append('rect')
     .attr('class', 'today')
     .attr('width', '0.5%')
     .attr('height', 26)
     .attr('x', (g) => `${100 * g.time_spent(now) - 0.25}%`)
     .attr('y', 42);

   // Draw start as text
   svg.append('text')
     .attr('class', 'start')
     .attr('text-anchor', 'start')
     .attr('x', 0)
     .attr('y', 40)
     .text((g) => `${new Date(g.start).toISOString().slice(0, 10)}`);

   // Draw end as text
   svg.append('text')
     .attr('class', 'end')
     .attr('text-anchor', 'end')
     .attr('x', '100%')
     .attr('y', 38)
     .text((g) => `${new Date(g.end).toISOString().slice(0, 10)}`);

   // Draw baseline as text
   svg.append('text')
     .attr('class', 'baseline')
     .attr('text-anchor', 'start')
     .attr('x', 0)
     .attr('y', 80)
     .text((g) => `${g.baseline}`)

   // Draw target/unit as text
   svg.append('text')
     .attr('class', 'target')
     .attr('text-anchor', 'end')
     .attr('x', '100%')
     .attr('y', 80)
     .text((g) => `${g.target} ${g.unit}`);
  }
}
