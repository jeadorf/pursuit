"use strict"


class Goal {
  constructor({id = "goal",
               name = "Goal",
               target = 1.0,
               baseline = 0.0,
               current = null,
               start = new Date(),
               end = new Date()}) {
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
    let total = this._end.getTime() - this._start.getTime();
    let spent = by_date.getTime() - this._start.getTime();
    return total == 0 ? 1.0 : spent / total;
  }

  is_on_track(by_date) {
    return this.progress >= this.time_spent(by_date);
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

  loadGoalsFromJson(json) {
    let gs = JSON.parse(json, (k, v) => {
      if (k == 'start' || k == 'end') {
        return new Date(v);
      }
      return v;
    });
    this._goals = gs.map((g) => new Goal(g));
  }
 
  render(containerSelector) {
    let ih = 100;
    let svg = (
      d3.select(containerSelector)
        .append('svg')
        .attr('style', 'margin: auto; display: flex')
        .attr('width', '500px')
        .attr('height', `${ih * this._goals.length}px`));

    // Draw names
    (svg
      .selectAll('whatever')
        .data(this._goals)
      .enter()
        .append('text')
          .attr('style', 'font: 15px sans-serif')
          .attr('x', 0)
          .attr('y', (d, i) => i * ih + 15 + 5)
          .text((d) => d.name)
    );

    // Draw progress bar wires
    (svg
      .selectAll('whatever')
        .data(this._goals)
      .enter()
        .append('rect')
          .attr('width', '500')
          .attr('height', '6')
          .attr('fill', 'lightgrey')
          .attr('y', (d, i) => i * ih + 52)
    );
 
    // Draw progress bars
    let now = new Date();
    (svg
      .selectAll('whatever')
        .data(this._goals)
      .enter()
        .append('rect')
          .attr('width', (d) => `${100*d.progress}%`)
          .attr('height', '30')
          .attr('fill', (d) => d.is_on_track(now) ? '#88bb77' : '#bb6677')
          .attr('fill-opacity', '0.6')
          .attr('y', (d, i) => i * ih + 40)
    );

    // Draw current date 
    (svg
      .selectAll('whatever')
        .data(this._goals)
      .enter()
        .append('rect')
          .attr('width', '3')
          .attr('height', '30')
          .attr('fill', 'orange')
          .attr('x', (d) => 500 * d.time_spent(now) - 1)
          .attr('y', (d, i) => i * ih + 40)
    );

    // Draw start as text
    (svg
      .selectAll('whatever')
        .data(this._goals)
      .enter()
        .append('text')
          .attr('style', 'font: 11px sans-serif; fill: darkgrey')
          .attr('text-anchor', 'start')
          .attr('x', 0)
          .attr('y', (d, i) => i * ih + 38)
          .text((d) => `${d.start.toISOString().slice(0, 10)}`)
    );

    // Draw end as text
    (svg
      .selectAll('whatever')
        .data(this._goals)
      .enter()
        .append('text')
          .attr('style', 'font: 11px sans-serif; fill: darkgrey')
          .attr('text-anchor', 'end')
          .attr('x', 500)
          .attr('y', (d, i) => i * ih + 38)
          .text((d) => `${d.end.toISOString().slice(0, 10)}`)
    );

    // Draw baseline as text
    (svg
      .selectAll('whatever')
        .data(this._goals)
      .enter()
        .append('text')
          .attr('style', 'font: 11px sans-serif; fill: darkgrey')
          .attr('text-anchor', 'start')
          .attr('x', 0)
          .attr('y', (d, i) => i * ih + 80)
          .text((d) => `${d.baseline}`)
    );

    // Draw target as text
    (svg
      .selectAll('whatever')
        .data(this._goals)
      .enter()
        .append('text')
          .attr('style', 'font: 11px sans-serif; fill: darkgrey')
          .attr('text-anchor', 'end')
          .attr('x', 500)
          .attr('y', (d, i) => i * ih + 80)
          .text((d) => `${d.target}`)
    );
  }

  signIn(googleUser, {
    profileImage = document.querySelector('#profile-image'),
    signInButton = document.querySelector('#signin-button'),
    signOutButton = document.querySelector('#signout-button'),
  }) {
    this._googleUser = googleUser;

    if (profileImage) {
      profileImage.src = googleUser.getBasicProfile().getImageUrl();
      profileImage.style.display = 'block';
    }

    if (signInButton) {
      signInButton.style.display = 'none';
    }

    if (signOutButton) {
      signOutButton.style.display = 'block';
    }
  }

  signOut({
    profileImage = document.querySelector('#profile-image'),
    signInButton = document.querySelector('#signin-button'),
    signOutButton = document.querySelector('#signout-button'),
    testing = false,
  }) {
    let afterSignOut = () => {
      this._googleUser = null;
      this._goals = [];

      if (profileImage) {
        profileImage.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
        profileImage.style.display = 'none';
      }

      if (signInButton) {
        signInButton.style.display = 'block';
      }

      if (signOutButton) {
        signOutButton.style.display = 'none';
      }
    }
    if (testing) {
      afterSignOut();
    } else {
      let auth2 = gapi.auth2.getAuthInstance();
      auth2.signOut().then(afterSignOut);
    }
  }

  signedIn() {
    return this._googleUser ? true : false;
  }

  idToken() {
    return this._googleUser.getAuthResponse().id_token;
  }
}

