class World {
  constructor() {
    this.beings = [];

    this.time = 0;
    this.killing_time = 0;

    this.big_bang(init_population);
  }
  big_bang(n) {
    for (let i = 0; i < n; i++) {
      this.beings.push(new Being(random(50, width), random(50, height)));
    }
  }
  exist() {
    background(255);

    this.keep_time();
    this.sustain_beings();
    this.kill_beings();
  }
  sustain_beings() {
    for (let being of this.beings) {
      being.exist();
      if (this.beings.length > 2) this.beings.reproduce;
    }
  }
  keep_time() {
    //on this world, time exists as a 24-second loop.
    this.time = Math.floor((frameCount / 60) % day_length);
  }
  kill_beings() {
    //as beings age, their probability to die increases. therefore, it is almost imminent if they are 100.
    if (this.time === 0) {
      this.killing_time = Math.floor(Math.random() * day_length);
    }

    if (this.time !== this.killing_time) return;

    for (let i = this.beings.length - 1; i >= 0; i--) {
      const age = this.beings[i].curr_age;
      const age_f = constrain(age / 100, 0, 1);

      const chance_of_death = 0.002 + 0.35 * Math.pow(age_f, 3);

      if (Math.random() < chance_of_death) {
        this.beings.splice(i, 1);
      }
    }
  }
}
