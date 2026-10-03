class World {
  constructor(
    w,
    h,
    _init_population = 4,
    _day_length = 24,
    _max_mass = 10,
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
    //a day is always 24 hours (as we know them), & everything in it is measured in those hours. day_length only sets how long a day lasts on screen: day_length × 60 frames (~day_length seconds). so, it's how fast the world plays.
    this.day_hours = 24;
    this.day_frames = this.day_length * 60; //frames in a day.
    this.hour_length = this.day_frames / this.day_hours; //frames in an hour (60 when day_length is 24; fewer in shorter days).
    this.time = 0; //the hour of the day (0–23).
    this.clock = 0; //the time of day, in hours (incl. fractions; 0–24).
    this.new_hour = false; //true on the first frame of every hour.
    this.new_day = false; //true on the first frame of every day.
    this.min_stay = 1; //the least hours a being stays at a place.
    this.beings = [];

    //p5 stuff; globally; once:
    noStroke();
    // noFill();

    this.killing_time = 0;

    //places lie within this distance of the world's centre:
    this.reach = Math.min(this.bounds.w, this.bounds.h) * 0.45;

    const places_n = constrain(
      Math.floor(this.init_population / 4),
      2,
      this.init_population,
    );
    this.places = this.get_places(this.bounds.w, this.bounds.h, places_n);

    //roughly, the distance between neighbouring places:
    this.place_spacing = this.reach * Math.sqrt(Math.PI / places_n);

    //speed is measured in the world's own geography: at full energy (10), a being reaches a neighbouring place in about 3/4 of an hour. (so, on screen, beings move faster in shorter days.)
    this.pace = this.place_spacing / (0.75 * this.hour_length); //pixels per frame.
  }

  /*
  initalize the world, with an init population n with distributed ages (mostly adults; some children & elders).
  */
  initialize() {
    for (let i = 0; i < this.init_population; i++) {
      let age = Math.round(constrain(randomGaussian(32, 18), 0, 80));
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
    if (this.debug_mode) {
      background(255); //temp. remove when adding interpretations.
    }

    this.keep_time();
    this.count_crowds();

    for (let being of this.beings) {
      being.exist();
    }

    if (this.beings.length > 2) {
      this.prevent_collisions();
      this.kill_and_make_beings();
    }

    //after movement & collisions, keep everyone (incl. newborns, who don't move) inside the world.
    for (let being of this.beings) {
      being.constrain();
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
  // get_hotspots(w, h, n, min_spacing) {
  //   let posis = [];
  //   let size = min_spacing;

  //   //check if co-centric circles min_spacing apart can fit onto the space:
  //   const can_fit = Math.floor(Math.min(w, h) / min_spacing) >= n;

  //   //based on that, do either of the two branches:
  //   const origin = createVector(width / 2, height / 2);
  //   if (can_fit) {
  //     //randomly plot them on the circles (they will always be at-least min-spacing apart).
  //     for (let i = 0; i < n; i++) {
  //       let theta = random(TWO_PI);
  //       let x = origin.x + (size / 2) * cos(theta);
  //       let y = origin.y + (size / 2) * sin(theta);
  //       posis.push([x, y]);
  //       size += min_spacing;
  //     }
  //   } else {
  //     //see how many can fit:
  //     let circle_count = 0;
  //     while (origin.x + size / 2 < w && origin.y + size / 2 < h) {
  //       size += min_spacing;
  //       circle_count++;
  //     }
  //     const spots_on_each = Math.ceil(n / circle_count);

  //     //reset size:
  //     size = min_spacing;

  //     let drawn = 0;

  //     for (let i = 0; i < circle_count; i++) {
  //       let start_theta = random(TWO_PI);
  //       let inc = TWO_PI / circle_count;
  //       let theta = start_theta;

  //       for (let j = 0; j < spots_on_each && drawn < n; j++) {
  //         let x = origin.x + (size / 2) * cos(theta);
  //         let y = origin.y + (size / 2) * sin(theta);
  //         posis.push([x, y]);
  //         theta += inc;
  //         drawn++;
  //       }
  //       size += min_spacing;
  //     }
  //   }
  //   return posis;
  // }

  /*
  generate places in the world (one for every 4 people), spread evenly on a sunflower spiral within the world's reach. each place keeps count of the crowd staying at it.

  chatgpt generated better distribution.
  */
  get_places(w, h, n) {
    const places = [];
    const origin = createVector(w / 2, h / 2);
    const goldenAngle = PI * (3 - sqrt(5));

    for (let i = 0; i < n; i++) {
      const r = this.reach * sqrt((i + 0.5) / n);
      const theta = i * goldenAngle;

      places.push({
        pos: createVector(origin.x + r * cos(theta), origin.y + r * sin(theta)),
        crowd: 0,
      });
    }

    return places;
  }
  /*
  count how many beings are staying at each place.
  */
  count_crowds() {
    for (let place of this.places) {
      place.crowd = 0;
    }
    for (let being of this.beings) {
      if (being.state === "staying" && being.place) being.place.crowd++;
    }
  }
  /*
  a place is as big as the crowd at it: the room its crowd takes up (circles pack ~90% densely), plus room for one more to join at its edge.
  */
  get_place_radius(place) {
    const crowd_radius = (this.max_mass / 2) * Math.sqrt(place.crowd / 0.9);
    return crowd_radius + this.max_mass;
  }

  /*
  keep time as a day_length-second loop: the 24 hours of a day are spread over its frames. (an hour needn't be a whole number of frames; so, a new hour is the first frame past each hour's mark.)
  */
  keep_time() {
    const frame_of_day = frameCount % this.day_frames;
    this.new_day = frame_of_day === 0;
    this.clock = frame_of_day / this.hour_length;
    this.time = Math.floor(this.clock);
    this.new_hour =
      this.new_day ||
      Math.floor((frame_of_day - 1) / this.hour_length) < this.time;
  }
  /*
  kill beings, when beings >2.
  */
  kill_and_make_beings() {
    //pick the killing hour once, at the start of each day.
    if (this.new_day) {
      this.killing_time = Math.floor(Math.random() * this.day_hours);
    }

    //once a day, at the killing hour, each being may die (by its own chance; see being.get_death_chance).
    if (
      this.new_hour &&
      this.time === this.killing_time &&
      this.beings.length > 0.95 * this.init_population
    ) {
      for (let i = this.beings.length - 1; i >= 0; i--) {
        if (Math.random() < this.beings[i].get_death_chance()) {
          this.beings.splice(i, 1);
        }
      }
    }

    //when the world is short of beings, beings may reproduce.
    if (this.beings.length < this.init_population) {
      //shuffled, so that beings early in the array aren't always first to reproduce.
      const valid_beings = shuffle(
        this.beings.filter((being) => being.age >= 18 && being.age <= 45),
      );

      //a pair has one child at most, per round.
      const had_child = new Set();

      let i = 0;
      while (
        this.beings.length < this.init_population &&
        i < valid_beings.length
      ) {
        if (had_child.has(valid_beings[i])) {
          i++;
          continue;
        }
        const newborn = valid_beings[i].reproduce(had_child);
        if (newborn) this.beings.push(newborn);
        i++;
      }
    }
  }

  /*
  push overlapping beings apart, using a spatial grid so we only compare beings in neighbouring cells.
  */
  prevent_collisions() {
    const passes = 2;
    const slop = 0.5; // ignore tiny overlaps that cause jitter.

    //two beings can only overlap if they're closer than the largest mass, so that's our cell size.
    let cell_size = 1;
    for (let being of this.beings) {
      if (being.mass > cell_size) cell_size = being.mass;
    }

    //numeric cell keys (cheaper than strings); cols is wide enough for any on-screen cell.
    const cols = Math.ceil(this.bounds.w / cell_size) + 3;
    const cell_key = (cx, cy) => (cy + 1) * cols + (cx + 1);

    for (let pass = 0; pass < passes; pass++) {
      const grid = new Map();

      for (let i = 0; i < this.beings.length; i++) {
        const b = this.beings[i];
        const key = cell_key(
          Math.floor(b.pos.x / cell_size),
          Math.floor(b.pos.y / cell_size),
        );

        let bucket = grid.get(key);
        if (!bucket) grid.set(key, (bucket = []));
        bucket.push(i);
      }

      for (let i = 0; i < this.beings.length; i++) {
        const a = this.beings[i];
        const acx = Math.floor(a.pos.x / cell_size);
        const acy = Math.floor(a.pos.y / cell_size);

        for (let ox = -1; ox <= 1; ox++) {
          for (let oy = -1; oy <= 1; oy++) {
            const bucket = grid.get(cell_key(acx + ox, acy + oy));
            if (!bucket) continue;

            for (const j of bucket) {
              if (j <= i) continue;

              const b = this.beings[j];
              const max_d = (a.mass + b.mass) / 2;

              let dx = b.pos.x - a.pos.x;
              let dy = b.pos.y - a.pos.y;
              let d2 = dx * dx + dy * dy;

              if (d2 >= (max_d - slop) * (max_d - slop)) continue;

              let d = Math.sqrt(d2);
              if (d === 0) {
                dx = 1;
                dy = 0;
                d = 1;
              }

              const overlap = max_d - d;
              if (overlap <= slop) continue;

              //each being moves half the overlap, away from the other.
              const push = (overlap - slop) / 2 / d;
              a.pos.x -= dx * push;
              a.pos.y -= dy * push;
              b.pos.x += dx * push;
              b.pos.y += dy * push;
            }
          }
        }
      }
    }
  }
  show_debugs() {
    push();
    rectMode(CENTER);
    noFill();
    strokeWeight(1);
    stroke(255, 0, 0);
    for (let place of this.places) {
      square(place.pos.x, place.pos.y, this.max_mass);
    }
    pop();

    let tracked = this.beings[0];
    if (!tracked) return;

    //show visually:
    push();
    textSize(12);
    noStroke();
    fill(255, 0, 0);
    textAlign(CENTER);
    text(
      "[" + 0 + "]",
      tracked.pos.x + tracked.mass * 1.5,
      tracked.pos.y + tracked.mass / 2,
    );
    pop();

    //log once per hour, not every frame. it shows what a being exposes to interpretations (as in the readme), by the same names:
    if (!this.new_hour) return;

    const xy = (v) => v.x.toFixed(0) + ", " + v.y.toFixed(0);

    console.log(
      "beings[" + 0 + "]" + "\n",
      "age: " + tracked.age + "\n",
      "pos: " + xy(tracked.pos) + "\n",
      "mass: " + tracked.mass + "\n",
      "energy: " + tracked.energy + "\n",
      "destination: " +
        (tracked.destination ? xy(tracked.destination) : "null") +
        "\n",
      "busyness: " + tracked.busyness + "\n",
      "schedule: " +
        tracked.schedule.map(([start, end]) => start + "-" + end).join(", ") +
        "\n",
      "get_speed(): " + tracked.get_speed().toFixed(2) + "\n",
      "get_neighbours(): " + tracked.get_neighbours().length + " beings" + "\n",
    );
  }
}
