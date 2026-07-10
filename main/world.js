class World {
  constructor() {
    this.time = 0;
    this.beings = [];

    this.killing_time = 0;
    this.hotspots = this.get_hotspots(width, height, 100, 100);
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
  generate hotspots in the world so that there is atleast one hotspot for 4 people.
  */
  get_hotspots(w, h, n, min_spacing) {
    let posis = [];
    let size = min_spacing;

    //check if co-centric circles min_spacing apart can fit onto the space:
    const can_fit = Math.floor(Math.min(w, h) / min_spacing) >= n;

    //based on that, do either of the two branches:
    const origin = createVector(width / 2, height / 2);
    if (can_fit) {
      //randomly plot them on the circles (they will always be at-least min-spacing apart).
      for (let i = 0; i < n; i++) {
        let theta = random(TWO_PI);
        let x = origin.x + (size / 2) * cos(theta);
        let y = origin.y + (size / 2) * sin(theta);
        /* to see:
          // noFill();
          // stroke(0);
          // strokeWeight(0.5);
          // // circle(origin.x, origin.y, size);
          // strokeWeight(10);
          // stroke(255, 0, 0);
          // point(x, y);
        */
        posis.push([x, y]);
        size += min_spacing;
      }
    } else {
      //see how many can fit:
      let circle_count = 0;
      while (origin.x + size / 2 < w && origin.y + size / 2 < h) {
        /*to see:
          noFill();
          stroke(0);
          strokeWeight(0.5);
          circle(origin.x, origin.y, size);
        */
        size += min_spacing;
        circle_count++;
      }
      const spots_on_each = Math.ceil(n / circle_count);

      //reset size:
      size = min_spacing;

      let drawn = 0;

      for (let i = 0; i < circle_count; i++) {
        let start_theta = random(TWO_PI);
        let inc = TWO_PI / circle_count;
        let theta = start_theta;

        for (let j = 0; j < spots_on_each && drawn < n; j++) {
          let x = origin.x + (size / 2) * cos(theta);
          let y = origin.y + (size / 2) * sin(theta);
          /*to see:
            stroke(255, 0, 0);
            strokeWeight(10);
            point(x, y);
          */
          posis.push([x, y]);
          theta += inc;
          drawn++;
        }
        size += min_spacing;
      }
    }
    return posis;
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
        // being.reproduce();
      }
    }

    if (this.beings.length > 2) {
      this.prevent_collisions();
      this.kill_beings();
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
      const age = this.beings[i].age;
      const age_f = constrain(age / 100, 0, 1);

      const chance_of_death = 0.002 + 0.35 * Math.pow(age_f, 3);

      if (Math.random() < chance_of_death) {
        this.beings.splice(i, 1);
      }
    }
  }
  /*
  prevent the possibility of two beings taking up the same space in the world, when beings >2.
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
