class Being {
  constructor(_x, _y, _age) {
    //inherited:
    this.pos = createVector(_x, _y);
    this.age = _age;

    //kind of like genetics, but not inherited (upto chance).
    this.maxes = {
      max_mass: constrain(Math.floor(randomGaussian(10, 6)), 5, world.max_mass),
      max_mass_age: Math.floor(randomGaussian(18, 1)),
      speed_mult: random(0.05, 0.2),
    };

    this.mass = this.get_mass();
    this.energy = this.get_energy();
    this.speed = createVector(0, 0);
    this.destinations = [];
    this.destination = this.pos.copy();
    this.schedule = this.get_schedule(this.age);
  }
  /*
  beings age, exist & move.
  */
  exist() {
    if (world.debug_mode) {
      this.show();
    }
    this.get_curr_age();
    if (this.age > 1) {
      this.move();
    }
  }
  show() {
    push();
    noFill();
    let col = map(this.age, 0, 80, 190, 0);

    translate(this.pos.x, this.pos.y);

    stroke(col);
    circle(0, 0, this.mass);

    // Direction towards destination
    const dir = p5.Vector.sub(this.destination, this.pos);
    rotate(dir.heading());

    // Draw a line pointing forward
    line(0, 0, this.mass * 0.75, 0);
    pop();
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
      // (this.energy / this.mass) * Math.sqrt(d) * this.maxes.speed_mult;
      this.energy / this.mass;

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
  when the world is out of balance, beings in close proximity of each other (between ages 18-45) have a chance of reproducing.
  */
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
    let avl_time = Array.from({ length: world.day_length }, (_, i) => i);
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
    if (frameCount % (60 * world.day_length) === 0) {
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
  get_neighbours(radius = world.max_mass * 2, beings = world.beings) {
    const r2 = radius * radius;

    return beings.filter((being) => {
      if (being === this) return false;
      return p5.Vector.sub(being.pos, this.pos).magSq() <= r2;
    });
  }
}
