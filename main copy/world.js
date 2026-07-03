class World {
  constructor() {
    this.beings = [];

    this.time = 0;
    this.killing_time = 0;

    this.big_bang(1);
  }
  big_bang(n) {
    for (let i = 0; i < n; i++) {
      this.beings.push(new Being(random(50, width), random(50, height)));
    }
  }
  exist() {
    background(255);

    this.keep_time();

    //this.kill();

    for (let being of this.beings) {
      being.exist();
      if (this.beings.length > 2) this.beings.reproduce;
    }
  }
  keep_time() {
    //on this world, time exists as a 24-second loop.
    this.time = Math.floor((frameCount / 60) % 1);
  }
  kill() {
    //as beings age, their probability to die increases. therefore, it is almost imminent if they are 1000.
    if (this.time == 0) {
      //find a new killing time for the day:
      this.killing_time = Math.round(Math.random(0, 5));
    }

    if (this.time == this.killing_time) {
      for (let i = 0; i < this.beings.length; i++) {
        let chance = Math.random().toFixed(2);
        let p = this.beings[i].curr_age / 1000;

        if (p > chance) {
          this.beings.splice(i, 1);
        }
      }
    }
  }
}
