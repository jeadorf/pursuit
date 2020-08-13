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
  constructor({id = 'goal',
               name = 'Goal',
               target = 1.0,
               baseline = 0.0,
               current = null,
               start = 0,
               end = 0}) {
    this._id = id;
    this._name = name;
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
          name: g.name,
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
    return new Objective({
      id: snapshot.id,
      name: objective.name,
      description: objective.description,
      goals: (objective.goals ?? []).map((g) => 
        new Goal({
          name: g.name,
          start: g.start,
          end: g.end,
          baseline: g.baseline,
          target: g.target,
          current: g.current,
       }))
    });
  }
}


class SafeMarkdownRenderer {
  render(markdown) {
    let rawHtml = marked(markdown);
    return sanitizeHtml(rawHtml, {
      allowedTags: [
        'p', 'code', 'em', 'strong'
      ]
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
        this.fetchObjectives(user.uid);
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
 
  fetchObjectives(uid) {
    (firebase
      .firestore()
      .collection('users')
      .doc(uid)
      .collection('objectives')
      .withConverter(new ObjectiveConverter())
      .get().then((docs) => {
        let objectives = [];
        docs.forEach((d) => {
          objectives.push(d.data());
        });
        this.objectives = objectives;
        this.render();
        document.querySelector('#app').style.display = 'flex';
    }));
  }

  render() {
    d3.select('#app > *').remove();

    for (let o of this.objectives) {
      let sortByName = (a, b) => (a.name > b.name
                                    ? 1
                                    : a.name < b.name
                                        ? -1
                                        : 0);
      let sortedGoals = o.goals.sort(sortByName);

      let odiv  = (
        d3.select('#app')
          .append('div')
          .attr('class', 'objective'));

      let markdown = new SafeMarkdownRenderer();
      odiv.html(`<h2>${markdown.render(o.name)}</h2> ${markdown.render(o.description ?? '')}`);

      let ih = 100;
      let width = 800;
      let svg = (
        d3.select('#app')
          .append('svg')
          .attr('class', 'chart')
          .attr('viewBox', `0 0 ${width} ${ih * sortedGoals.length}`));

      // Draw names
      (svg
        .selectAll('whatever')
          .data(sortedGoals)
        .enter()
          .append('text')
            .attr('class', 'name')
            .attr('style', 'font-size: 16px')
            .attr('x', 0)
            .attr('y', (d, i) => i * ih + 15 + 5)
            .text((d) => d.name)
      );

      // Draw progress bar wires
      (svg
        .selectAll('whatever')
          .data(sortedGoals)
        .enter()
          .append('rect')
            .attr('width', width)
            .attr('height', 6)
            .attr('fill', 'lightgrey')
            .attr('y', (d, i) => i * ih + 52)
      );
 
      // Draw progress bars
      let now = new Date();
      (svg
        .selectAll('whatever')
          .data(sortedGoals)
        .enter()
          .append('rect')
            .attr('class', 'current')
            .attr('width', (d) => `${100*d.progress}%`)
            .attr('height', 26)
            .attr('class', (d) => (d.is_on_track(now.getTime())
                                    ? 'current ontrack'
                                    : 'current offtrack'))
            .attr('y', (d, i) => i * ih + 42)
      );

      // Draw current date 
      (svg
        .selectAll('whatever')
          .data(sortedGoals)
        .enter()
          .append('rect')
            .attr('class', 'today')
            .attr('width', 3)
            .attr('height', 26)
            .attr('x', (d) => width * d.time_spent(now) - 1)
            .attr('y', (d, i) => i * ih + 42)
      );

      // Draw start as text
      (svg
        .selectAll('whatever')
          .data(sortedGoals)
        .enter()
          .append('text')
            .attr('class', 'start')
            .attr('style', 'font-size: 14px')
            .attr('text-anchor', 'start')
            .attr('x', 0)
            .attr('y', (d, i) => i * ih + 40)
            .text((d) => `${new Date(d.start).toISOString().slice(0, 10)}`)
      );

      // Draw end as text
      (svg
        .selectAll('whatever')
          .data(sortedGoals)
        .enter()
          .append('text')
            .attr('class', 'end')
            .attr('style', 'font-size: 14px')
            .attr('text-anchor', 'end')
            .attr('x', width)
            .attr('y', (d, i) => i * ih + 38)
            .text((d) => `${new Date(d.end).toISOString().slice(0, 10)}`)
      );

      // Draw baseline as text
      (svg
        .selectAll('whatever')
          .data(sortedGoals)
        .enter()
          .append('text')
            .attr('class', 'baseline')
            .attr('style', 'font-size: 14px')
            .attr('text-anchor', 'start')
            .attr('x', 0)
            .attr('y', (d, i) => i * ih + 80)
            .text((d) => `${d.baseline}`)
      );

      // Draw target as text
      (svg
        .selectAll('whatever')
          .data(sortedGoals)
        .enter()
          .append('text')
            .attr('class', 'target')
            .attr('style', 'font-size: 14px')
            .attr('text-anchor', 'end')
            .attr('x', width)
            .attr('y', (d, i) => i * ih + 80)
            .text((d) => `${d.target}`)
      );
    }
  }
}
