class Being {
  constructor(x, y, age, db_col_r = 0) {
    this.pos = createVector(x, y);
    this.age = age;

    this.maxes = {
      max_mass: constrain(Math.floor(randomGaussian(10, 6)), 5, maximum_mass),
      max_mass_age: Math.floor(randomGaussian(18, 1)),
      speed_mult: random(0.05, 0.2),
    };

    this.mass = this.get_mass();
    this.energy = this.get_energy();
    this.speed = createVector(0, 0);
    this.destinations = [];
    this.destination = this.pos.copy();
    this.schedule = this.get_schedule(this.age);

    //temp:
    this.r = db_col_r;
  }
  /*
  beings age, exist & move.
  */
  exist() {
    this.body();
    this.get_curr_age();
    if (this.age > 1) {
      this.move();
    }
  }
  body() {
    // fill(0, map(this.age, 0, 60, 1, 255));

    if (this.age > 1) {
      this.r = 0;
    }
    fill(this.r, 0, 0);
    circle(this.pos.x, this.pos.y, this.mass);

    if (debug_mode) {
      stroke(0);
      strokeWeight(1);
      line(this.pos.x, this.pos.y, this.destination.x, this.destination.y);
    }
  }
  move() {
    let d = dist(
      this.pos.x,
      this.pos.y,
      this.destination.x,
      this.destination.y,
    );

    //move according to a schedule.
    for (let i = 0; i < this.schedule.length; i++) {
      if (world.time == this.schedule[i][0] && d < this.mass) {
        this.destination.set(this.destinations[i]);
      }
    }

    let direction = p5.Vector.sub(this.destination, this.pos);
    direction.normalize();

    let speed =
      (this.energy / this.mass) * Math.sqrt(d) * this.maxes.speed_mult;

    direction.mult(speed);
    this.pos.add(direction);

    this.constrain();
  }
  /*
  beings are constrained to a surface.
  */
  constrain() {
    if (
      this.pos.x + this.mass / 2 >= width ||
      this.pos.x - this.mass / 2 <= 0
    ) {
      this.speed.x *= -1;
    }
    if (
      this.pos.y + this.mass / 2 >= height ||
      this.pos.y - this.mass / 2 <= 0
    ) {
      this.speed.y *= -1;
    }
  }
  /*
  when more than 2 beings exist, and are in close proximity with atleast one of them between 18 - 45, they have a chance of reproducing.
  */
  // reproduce() {
  //   if (this.age < 18 || this.age > 45) return;

  //   // const neighbours = this.get_neighbours();

  //   const neighbours = this.get_neighbours().filter(
  //     (being) => being.age >= 18,
  //   );

  //   //probability is high (not 1) when between 18 - 30 and reduces afterwards and close to 0 after 40.

  //   for (let neighbour of neighbours){
  //   let p =
  //     0.2 *
  //     (1 / (1 + Math.exp(-(this.age - 18) / 2))) *
  //     (1 / (1 + Math.exp((this.age - 40) / 2)));

  //   if (Math.random() < p) {
  //     world.beings.push(
  //       new Being(
  //         (this.pos.x + neighbour.pos.x) / 2,
  //         (this.pos.y + neighbour.pos.y) / 2,
  //         0,
  //         255
  //       ),
  //     );
  //   }
  // }
  // }
  reproduce() {
    const neighbours = this.get_neighbours();
    if (neighbours.length < 1) return null;

    const p =
      0.2 *
      (1 / (1 + Math.exp(-(this.age - 18) / 2))) *
      (1 / (1 + Math.exp((this.age - 40) / 2)));

    const neighbour = random(neighbours);
    if (Math.random() >= p) return null;

    return new Being(
      (this.pos.x + neighbour.pos.x) / 2,
      (this.pos.y + neighbour.pos.y) / 2,
      0,
      255,
    );
  }
  /*
  ----------------------------------------
  getters:
  ----------------------------------------
  */

  /*
  for given age, get a schedule based on the busyness (the older you are, the more busy you get).
  */
  get_schedule(age) {
    let avl_time = Array.from({ length: day_length }, (_, i) => i);
    let schedule = [];

    //calculate available time slots based on age.
    const min = 2;
    const max = 12;
    const peak = 25;
    const sigma = 10; //spread-width.

    const g = Math.exp(-Math.pow(age - peak, 2) / (2 * sigma * sigma));
    const mean_busyness = min + (max - min) * g;

    const spread = 1.25 + (1 - g) * 3.5;

    let busyness = Math.round(randomGaussian(mean_busyness, spread));
    busyness = constrain(busyness, min, max);

    //^ this is the length of our to-be-created schedule array.

    let i = 0;

    while (i < busyness) {
      i = (i + Math.floor(Math.random() * 6)) % avl_time.length;
      let a = avl_time.splice(i, 1)[0],
        b = avl_time.splice(i, 1)[0];
      schedule.push(
        schedule.length ? [schedule[schedule.length - 1][1], a] : [a, b],
      );
    }

    schedule.push([schedule[schedule.length - 1][1], schedule[0][0]]);

    this.get_new_destinations(schedule);

    return schedule;
  }
  /*
  for a given array of schedules, get a set of destinations.
  */
  get_new_destinations(schedule) {
    this.destinations = [];

    schedule.forEach(() => {
      let rand_dest = random(world.hotspots);
      this.destinations.push(createVector(rand_dest[0], rand_dest[1]));
    });
  }
  /*
  based on the time of the world, get the current age.
  */
  get_curr_age() {
    //beings age by 1 unit a day.
    // if (world.time == 0 && frameCount % 60 == 0) {
    if (frameCount % (60 * day_length) === 0) {
      this.age += 1;

      //as age increases, energy decreases; while mass increases.
      this.mass = this.get_mass();
      this.energy = this.get_energy();

      if (this.age < 6 && this.age > 1) {
        this.schedule = this.get_schedule(this.age);
      } else if (this.age > 6 && this.age < 60) {
        let n = Math.random();

        if (n > 0.5) this.schedule = this.get_schedule(this.age);
      } else if (this.age > 60) {
        let n = Math.random();

        if (n < 0.25) this.schedule = this.get_schedule(this.age);
      }
    }
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

    const energy =
      (1 / (1 + Math.exp(-(this.age - 18) / 2))) *
      (1 / (1 + Math.exp((this.age - 35) / 5))) *
      m;

    return Math.round(energy * 1000) / 1000;
  }
  /*
  for a being, return an array of neighbours within a specific radius.
  */
  get_neighbours(radius = maximum_mass * 2, beings = world.beings) {
    const r2 = radius * radius;

    return beings.filter((being) => {
      if (being === this) return false;
      return p5.Vector.sub(being.pos, this.pos).magSq() <= r2;
    });
  }
}
