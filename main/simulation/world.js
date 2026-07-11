class World {
  constructor(
    w,
    h,
    _init_population,
    _day_length,
    _max_mass = 20,
    _debug_mode = false,
  ) {
    //inherited:
    this.bounds = {
      w,
      h,
    };
    this.init_population = _init_population;
    this.max_mass = _max_mass;
    this.day_length = _day_length;
    this.debug_mode = _debug_mode;

    //declared:
    this.time = 0;
    this.beings = [];

    //p5 stuff; globally; once:
    noStroke();
    // noFill();

    this.killing_time = 0;

    const hotspots_n = constrain(
      Math.floor(this.init_population / 4),
      2,
      this.init_population,
    );
    this.hotspots = this.get_hotspots(
      this.bounds.w,
      this.bounds.h,
      hotspots_n,
      (this.init_population / this.max_mass) * 4,
    );
  }

  /*
  initalize the world, with an init population n with distributed ages.
  */
  initialize() {
    for (let i = 0; i < this.init_population; i++) {
      let age = Math.round(constrain(randomGaussian(18, 20), 18, 60));
      const margin = {
        x: Math.floor(this.bounds.w * 0.05),
        y: Math.floor(this.bounds.h * 0.05),
      };

      this.beings.push(
        new Being(
          random(margin.x, this.bounds.w - margin.x),
          random(margin.y, this.bounds.h - margin.y),
          age,
        ),
      );
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
    }

    if (this.beings.length > 2) {
      this.prevent_collisions();
      this.kill_and_make_beings();
    }

    if (this.debug_mode) {
      this.show_debugs();
    }
  }
  /*
  ----------------------------------------
  helpers / getters:
  ----------------------------------------
  */

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
        posis.push([x, y]);
        size += min_spacing;
      }
    } else {
      //see how many can fit:
      let circle_count = 0;
      while (origin.x + size / 2 < w && origin.y + size / 2 < h) {
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
  keep time as a x-second loop; x specified in main.js. 
  */
  keep_time() {
    this.time = Math.floor((frameCount / 60) % this.day_length);
  }
  /*
  kill beings, when beings >2.
  */
  kill_and_make_beings() {
    //as beings age, their probability to die increases. therefore, it is almost imminent if they are 100.
    if (this.time === 0) {
      this.killing_time = Math.floor(Math.random() * this.day_length);
    }

    if (
      this.time == this.killing_time &&
      this.beings.length > 0.95 * this.init_population
    ) {
      for (let i = this.beings.length - 1; i >= 0; i--) {
        const age = this.beings[i].age;
        const age_f = constrain(age / 100, 0, 1);

        const chance_of_death = 0.0002 + 0.12 * Math.pow(age_f, 3);

        if (Math.random() < chance_of_death) {
          this.beings.splice(i, 1);
        }
      }
    } else if (this.beings.length < this.init_population) {
      const valid_beings = this.beings.filter(
        (being) => being.age >= 18 && being.age <= 45,
      );

      let i = 0;
      while (
        this.beings.length < this.init_population &&
        i < valid_beings.length
      ) {
        const newborn = valid_beings[i].reproduce();
        if (newborn) this.beings.push(newborn);
        i++;
      }
    }
  }

  prevent_collisions() {
    const cellSize = this.maximum_mass * 3;
    const passes = 2;
    const slop = 0.5; // ignore tiny overlaps that cause jitter.

    const cellKey = (cx, cy) => `${cx},${cy}`;

    for (let pass = 0; pass < passes; pass++) {
      const grid = new Map();

      for (let i = 0; i < this.beings.length; i++) {
        const b = this.beings[i];
        const cx = Math.floor(b.pos.x / cellSize);
        const cy = Math.floor(b.pos.y / cellSize);
        const key = cellKey(cx, cy);

        if (!grid.has(key)) grid.set(key, []);
        grid.get(key).push(i);
      }

      const neighborOffsets = [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
        [-1, 1],
        [-1, 0],
        [0, -1],
        [-1, -1],
        [1, -1],
      ];

      for (let i = 0; i < this.beings.length; i++) {
        const a = this.beings[i];
        const acx = Math.floor(a.pos.x / cellSize);
        const acy = Math.floor(a.pos.y / cellSize);

        for (const [dx, dy] of neighborOffsets) {
          const bucket = grid.get(cellKey(acx + dx, acy + dy));
          if (!bucket) continue;

          for (const j of bucket) {
            if (j <= i) continue;

            const b = this.beings[j];
            const max_d = (a.mass + b.mass) / 2;
            const delta = p5.Vector.sub(b.pos, a.pos);
            let d = delta.mag();

            if (d === 0) {
              delta.set(1, 0);
              d = 1;
            }

            const overlap = max_d - d;
            if (overlap <= slop) continue;

            const push = (overlap - slop) / 2;
            delta.normalize();
            delta.mult(push);

            a.pos.sub(delta);
            b.pos.add(delta);
          }
        }
      }
    }
  }
  show_debugs() {
    push();
    for (let i = 0; i < this.hotspots.length; i++) {
      strokeWeight(5);
      stroke(255, 0, 0);
      point(this.hotspots[i][0], this.hotspots[i][1]);
    }
    pop();

    //show visually:
    textSize(12);
    noStroke();
    fill(255, 0, 0);

    let tracked = this.beings[0];
    textAlign(CENTER);
    text(
      "[" + 0 + "]",
      tracked.pos.x + tracked.mass * 1.5,
      tracked.pos.y + tracked.mass / 2,
    );

    console.log(
      "beings[" + 0 + "]" + "\n",
      "time: " + this.time + "\n",
      "age: " + tracked.age + "\n",
      "mass: " + tracked.mass + "\n",
      "energy: " + tracked.energy + "\n",
      "schedule: " + tracked.schedule + "\n",
      "destinations: " +
        tracked.destination.x +
        ", " +
        tracked.destination.y +
        "\n",
    );
  }
}
