class World {
  constructor() {
    this.beings = [];

    this.time = 0;
    this.killing_time = 0;

    this.initialize(init_population);
  }
  /*
  initalize the world, with an init population n (declared globally in main.js) with scattered ages.
  */
  initialize(n) {
    for (let i = 0; i < n; i++) {
      let age = Math.round(constrain(randomGaussian(18, 20), 18, 60));
      this.beings.push(new Being(random(50, width), random(50, height), age));
    }
  }
  /*
  the world runs with time & beings.
  */
  run() {
    background(255); //temp. remove when adding interpretations.

    this.keep_time();

    for (let being of this.beings) {
      being.exist();

      if (this.beings.length > 2) {
        being.reproduce();
        this.kill_beings();
        this.prevent_collisions();
      }
    }
  }
  /*
  ----------------------------------------
  helpers:
  ----------------------------------------
  */

  /*
  keep time as a x-second loop; x specified in main.js. 
  */
  keep_time() {
    this.time = Math.floor((frameCount / 60) % day_length);
  }
  /*
  kill beings, when beings >2.
  */
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
  /*
  prevent the possibility of two beings taking up the same space in the world. 
  */
  prevent_collisions() {
    for (let i = 0; i < this.beings.length; i++) {
      for (let j = i + 1; j < this.beings.length; j++) {
        const a = this.beings[i];
        const b = this.beings[j];

        const max_d = (a.mass + b.mass) / 2;
        const delta = p5.Vector.sub(b.pos, a.pos);
        let d = delta.mag();

        if (d === 0) {
          //same spot.
          delta.set(random(-1, 1), random(-1, 1));
          d = delta.mag();
        }

        if (d < max_d) {
          const overlap = max_d - d;
          delta.normalize();
          delta.mult(overlap / 2);

          a.pos.sub(delta);
          b.pos.add(delta);
        }
      }
    }
  }
}
