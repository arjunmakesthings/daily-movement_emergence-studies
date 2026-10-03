class Being {
  constructor(_x, _y, _age) {
    //inherited:
    this.pos = createVector(_x, _y);
    this.age = _age;

    //kind of like genetics, but not inherited (upto chance).
    this.maxes = {
      max_mass: constrain(
        Math.floor(randomGaussian(10, 6)),
        Math.min(5, world.max_mass),
        world.max_mass,
      ),
      max_mass_age: Math.floor(randomGaussian(18, 1)),
      speed_mult: random(0.75, 1.25), //some walk faster than others.
      vigor: Math.exp(randomGaussian(0, 0.2)), //some have more energy than others (& so, live longer).
      range: world.place_spacing * Math.exp(randomGaussian(0.4, 0.6)), //how far one is willing to go: most stay local, a few roam.
    };

    this.mass = this.get_mass();
    this.energy = this.get_energy();

    //where a being is going, and what it's doing:
    this.destinations = []; //the places it frequents: one per slot of the schedule.
    this.place = null; //the place being travelled to, or stayed at.
    this.destination = null; //...& its position.
    this.slot = -1; //the slot of the schedule being followed (-1: not yet planned).
    this.state = "staying"; //"travelling" or "staying".

    //everyone keeps their own rhythm: a being's day starts at its own hour, frame-exact.
    this.day_start =
      Math.floor(random(world.day_hours) * world.hour_length) /
      world.hour_length;

    this.busyness = 0; //how many places the being would like to be at in a day (set with the schedule).
    this.slots = this.get_schedule(this.age); //the schedule, in hours incl. fractions (see get schedule()).
    this.next_plan = null; //"routine" or "timings": made on a birthday, taken up when the being's next day starts.
  }
  /*
  the schedule, in whole hours: [[start, end], ...], each rounded down to its hour (like world.time). (the being keeps it to the frame, in slots.)
  */
  get schedule() {
    return this.slots.map(([start, end]) => [Math.floor(start), Math.floor(end)]);
  }
  /*
  beings age, exist & move.
  */
  exist() {
    if (world.debug_mode) {
      this.show();
    }
    this.get_curr_age();
    if (this.next_plan && this.is_day_start()) {
      this.take_up_plan();
    }
    if (this.age > 1) {
      this.follow_schedule();
      this.move();
    }
  }
  show() {
    push();
    noFill();

    let t = this.age / 80; // normalize age 0-80

    let col = map(
      4 * Math.pow(t - 0.5, 2), // 1 at edges, 0 at middle
      0,
      1,
      0,
      190,
    );

    translate(this.pos.x, this.pos.y);

    stroke(col);
    circle(0, 0, this.mass);

    const dir = this.destination ? p5.Vector.sub(this.destination, this.pos) : createVector(0, 0);

    if (dir.mag() > this.mass && this.age > 1) {
      const heading = dir.heading();

      rotate(heading);

      line(0, 0, this.mass * 0.99, 0);
      push();
      translate(this.mass * 0.99, 0);

      line(0, 0, -this.mass * 0.25, -this.mass * 0.15);
      line(0, 0, -this.mass * 0.25, this.mass * 0.15);

      pop();
    }
    pop();
  }
  /*
  a being keeps to its schedule: where should i be right now? if that's somewhere else, it leaves for it — even if it never reached where it was going (it's late; the day moves on).
  */
  follow_schedule() {
    const slot = this.get_curr_slot();
    if (slot === this.slot) return;

    this.slot = slot;
    const place = this.destinations[slot];

    //already there? then stay.
    if (place === this.place && this.state === "staying") return;

    this.place = place;
    this.destination = place.pos;
    this.state = "travelling";
  }
  /*
  travel towards the destination. on arriving, stay there until the schedule says otherwise.
  */
  move() {
    if (this.state !== "travelling") return;

    if (this.has_arrived()) {
      this.state = "staying";
      return;
    }

    const direction = p5.Vector.sub(this.destination, this.pos);
    const speed = this.get_speed();

    //don't overshoot:
    if (direction.mag() <= speed) {
      this.pos.set(this.destination);
    } else {
      this.pos.add(direction.setMag(speed));
    }
  }
  /*
  beings are constrained to a surface (the world's bounds). called by the world after movement & collisions.
  */
  constrain() {
    const r = this.mass / 2;
    this.pos.x = constrain(this.pos.x, r, world.bounds.w - r);
    this.pos.y = constrain(this.pos.y, r, world.bounds.h - r);
  }
  /*
  when the world is out of balance, beings in close proximity of each other (between ages 18-45) have a chance of reproducing.

  `unavailable` holds beings that have already had a child this round; a pair that has a child joins them.
  */
  reproduce(unavailable) {
    //both beings need to be of reproducing age (& available).
    const neighbours = this.get_neighbours().filter(
      (being) =>
        being.age >= 18 && being.age <= 45 && !unavailable.has(being),
    );
    if (neighbours.length < 1) return null;

    const p =
      0.2 *
      (1 / (1 + Math.exp(-(this.age - 18) / 2))) *
      (1 / (1 + Math.exp((this.age - 40) / 2)));

    const neighbour = random(neighbours);
    if (Math.random() >= p) return null;

    unavailable.add(this);
    unavailable.add(neighbour);

    return new Being(
      (this.pos.x + neighbour.pos.x) / 2,
      (this.pos.y + neighbour.pos.y) / 2,
      0,
    );
  }
  /*
  ----------------------------------------
  getters:
  ----------------------------------------
  */

  /*
  for given age, get a schedule based on the busyness (the closer you are to 25, the busier you are).

  a schedule is a closed loop of [start, end] hours (fractions of an hour too): [[h0, h1], [h1, h2], ..., [hn, h0]]. at a slot's start, the being leaves for that slot's place, and stays there until the slot's end. so, a slot is as long as the trip to its place, plus the stay there.
  */
  get_schedule(age) {
    //calculate number of time slots based on age.
    const min = 2;
    const max = 12;
    const peak = 25;
    const sigma = 10; //spread-width.

    const g = Math.exp(-Math.pow(age - peak, 2) / (2 * sigma * sigma));
    const mean_busyness = min + (max - min) * g;

    const spread = 1.25 + (1 - g) * 3.5;

    let busyness = Math.round(randomGaussian(mean_busyness, spread));
    busyness = constrain(busyness, min, max);

    //^ this is how many places the being would like to be at in a day; the day may allow fewer.
    this.busyness = busyness;

    this.get_new_destinations(busyness);

    return this.get_timings();
  }
  /*
  plan a routine: a loop of (up to) n places the being frequents, repeated every day. it starts at the place nearest to where the being is, and each next place is picked near the last one. a place is only added if there's still time in the day to get there, stay, and get back round to the first place (so that the loop closes).
  */
  get_new_destinations(n) {
    const min_stay = world.min_stay;
    const first = this.get_nearest_place();

    //the hours back to the first place, from each place (asked of every place, at every step; so, worked out once):
    const hours_back = new Map(
      world.places.map((place) => [
        place,
        this.get_travel_hours(this.get_distance(place.pos, first.pos)),
      ]),
    );

    //the least a stop can take: a trip to a neighbouring place, plus the least stay.
    const least_stop = this.get_travel_hours(world.place_spacing) + min_stay;

    const route = [first];
    let hours_used = min_stay; //the stay at the first place.

    while (route.length < n) {
      const last = route[route.length - 1];
      const stops_after = n - route.length - 1; //the stops still wished for, after this one.

      const options = []; //places there's time to get to, stay at, and get back round from.
      const roomy = []; //...that also leave room for the stops after.

      for (let place of world.places) {
        if (place === last) continue;

        const hours =
          hours_used +
          this.get_travel_hours(this.get_distance(last.pos, place.pos)) +
          min_stay +
          hours_back.get(place);

        if (hours > world.day_hours) continue;
        options.push(place);

        if (hours + stops_after * least_stop <= world.day_hours) {
          roomy.push(place);
        }
      }
      if (options.length === 0) break;

      //prefer places that leave room for the rest of the day's stops; if none do, the day has fewer stops than wished.
      const next = this.pick_nearby(last, roomy.length ? roomy : options);
      hours_used +=
        this.get_travel_hours(this.get_distance(last.pos, next.pos)) +
        min_stay;
      route.push(next);
    }

    this.destinations = route;
  }
  /*
  time the route over a day, from the being's day start: each slot is the trip to its place, plus the stay there. the first trip is from wherever the being is (at its day start, that's where its last day ended: the last place of its loop).

  if the day can't fit the whole route (a slower body), the last places are dropped. spare time makes some stays longer.
  */
  get_timings() {
    const day = world.day_hours;

    let lengths = this.get_slot_lengths();
    while (this.sum(lengths) > day && this.destinations.length > 1) {
      this.destinations.pop();
      lengths = this.get_slot_lengths();
    }

    if (this.destinations.length === 1) {
      //only one place: stay there all day.
      lengths = [day];
    } else {
      //spare time is split into random shares, one for each stay (so, stays end at any moment, not on the hour):
      const spare = day - this.sum(lengths);
      const shares = lengths.map(() => Math.random());
      const total = this.sum(shares);
      lengths = lengths.map((length, i) => length + (spare * shares[i]) / total);
    }

    //lay the slots out over the day, from the day's start:
    let start = this.day_start;
    const schedule = lengths.map((length) => {
      const slot = [start, (start + length) % day];
      start = slot[1];
      return slot;
    });

    //close the loop exactly (sums of fractions can be a hair off):
    schedule[schedule.length - 1][1] = schedule[0][0];

    //new timings, so plan again.
    this.slot = -1;

    return schedule;
  }
  /*
  for each place of the route: the hours to get there (from the place before it; or, for the first, from where the being is), plus the least stay.
  */
  get_slot_lengths() {
    return this.destinations.map((place, i) => {
      const from = i === 0 ? this.pos : this.destinations[i - 1].pos;
      return (
        this.get_travel_hours(this.get_distance(from, place.pos)) +
        world.min_stay
      );
    });
  }
  /*
  pick one of the options, preferring those near `from`: the likelihood of a place falls off with its distance, at the being's own range.
  */
  pick_nearby(from, options) {
    const weights = options.map((place) =>
      Math.exp(-this.get_distance(from.pos, place.pos) / this.maxes.range),
    );

    let r = Math.random() * this.sum(weights);

    for (let i = 0; i < options.length; i++) {
      r -= weights[i];
      if (r <= 0) return options[i];
    }
    return options[options.length - 1];
  }
  /*
  the current slot is the one whose hours contain the world's clock. slots loop around the day; a slot that ends where it starts lasts the whole day.
  */
  get_curr_slot() {
    const day = world.day_hours;

    return this.slots.findIndex(([start, end]) => {
      const length = (end - start + day) % day || day;
      return (world.clock - start + day) % day < length;
    });
  }
  /*
  the place nearest to where the being is.
  */
  get_nearest_place() {
    let nearest = world.places[0];
    let nearest_d = Infinity;

    for (let place of world.places) {
      const d = p5.Vector.dist(this.pos, place.pos);
      if (d < nearest_d) {
        nearest = place;
        nearest_d = d;
      }
    }
    return nearest;
  }
  /*
  how many hours (incl. fractions) it takes this being to travel a distance.
  */
  get_travel_hours(distance) {
    const frames = distance / this.get_speed();
    return frames / world.hour_length;
  }
  /*
  the distance between two positions. plain maths, since this is asked a lot (p5.Vector.dist makes a new vector each call).
  */
  get_distance(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  sum(arr) {
    return arr.reduce((a, b) => a + b, 0);
  }
  /*
  a being has arrived once it's within its place (and a place is as big as the crowd at it).
  */
  has_arrived() {
    const d = this.get_distance(this.pos, this.destination);
    return d <= world.get_place_radius(this.place);
  }
  /*
  speed (pixels per frame) comes from energy, at one's own pace. (it doesn't depend on mass: mass is in pixels, so a world drawn bigger would move slower.)
  */
  get_speed() {
    return world.pace * (this.energy / 10) * this.maxes.speed_mult;
  }
  /*
  based on the time of the world, get the current age.
  */
  get_curr_age() {
    //beings age by 1 unit a day.
    if (world.new_day) {
      this.age += 1;

      //as age increases, energy decreases; while mass increases.
      this.mass = this.get_mass();
      this.energy = this.get_energy();

      //young beings get a new routine every year; adults sometimes; the old rarely.
      let new_routine = false;

      if (this.age > 1 && this.age <= 6) {
        new_routine = true;
      } else if (this.age > 6 && this.age <= 60) {
        new_routine = Math.random() < 0.5;
      } else if (this.age > 60) {
        new_routine = Math.random() < 0.25;
      }

      //either way, its next day is planned for its body's new pace; taken up when that day starts.
      this.next_plan = new_routine ? "routine" : "timings";
    }
  }
  /*
  is this the first frame of the being's day?
  */
  is_day_start() {
    const frame_of_day = frameCount % world.day_frames;
    return frame_of_day === Math.round(this.day_start * world.hour_length);
  }
  /*
  take up the plan made on the birthday: a new routine, or the same routine re-timed. either way, it's planned from where the being is, as its day starts.
  */
  take_up_plan() {
    this.slots =
      this.next_plan === "routine"
        ? this.get_schedule(this.age)
        : this.get_timings();
    this.next_plan = null;
  }
  /*
  the chance of dying today. as beings age, their probability to die increases; therefore, it is almost imminent if they are 100. the less vigor, the frailer (& vice-versa).
  */
  get_death_chance() {
    const age_f = constrain(this.age / 100, 0, 1);
    const frailty = 1 / this.maxes.vigor;

    return (0.0002 + 0.12 * Math.pow(age_f, 3)) * frailty * frailty;
  }
  /*
  for a given age, calculate mass.
  */
  get_mass() {
    //mass is an asymptotic-exponential-growth graph.

    const a = this.maxes.max_mass; //max.
    const b = this.maxes.max_mass_age; //in how many steps is max achieved.

    const mass = (a * (1 - Math.exp(-5 * (this.age / b)))) / (1 - Math.exp(-5));

    return Math.round(mass * 100) / 100;
  }
  /*
  for a given age, calculate energy. 
  */
  get_energy() {
    //energy is like a bell curve.

    /*
    https://www.desmos.com/calculator/3iioyvma2l

    f(x) = y = e^(-((x-a)^2) / b).
    */

    const m = 10;

    //it rises through childhood, peaks in the 20s & 30s, and declines through middle age (halving around 50); but never quite to nothing.
    const rise = 1 / (1 + Math.exp(-(this.age - 12) / 3));
    const fall = 1 / (1 + Math.exp((this.age - 50) / 7));
    const floor = 0.2; //the old keep a fifth of their energy.

    const energy =
      m * this.maxes.vigor * rise * (floor + (1 - floor) * fall);

    return Math.round(energy * 1000) / 1000;
  }
  /*
  for a being, return an array of neighbours within a specific radius.
  */
  get_neighbours(radius = world.max_mass * 2, beings = world.beings) {
    const r2 = radius * radius;
    const { x, y } = this.pos;

    return beings.filter((being) => {
      if (being === this) return false;
      const dx = being.pos.x - x;
      const dy = being.pos.y - y;
      return dx * dx + dy * dy <= r2;
    });
  }
}
