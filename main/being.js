class Being {
  constructor(x, y, curr_age) {
    this.pos = createVector(x, y);
    this.curr_age = curr_age;
    this.mass = this.get_mass();
    this.energy = this.get_energy();
    this.speed = createVector(0, 0);
    this.destinations = [];
    this.destination = this.pos.copy();

    this.schedule = this.get_schedule();
  }
  get_schedule() {
    let avl_time = Array.from({ length: day_length }, (_, i) => i),
      schedule = [],
      i = 0,
      business = constrain(
        map(this.curr_age, 0, 50, 1, avl_time.length - 1),
        1,
        avl_time.length - 1,
      );
    while (i < business) {
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
  get_new_destinations(schedule) {
    this.destinations = [];

    schedule.forEach(() => {
      this.destinations.push(createVector(random(width), random(height)));
    });
  }
  exist() {
    this.body();
    this.age();
    if (this.curr_age > 1) {
      this.move();
    }
  }
  body() {
    fill(0, map(this.curr_age, 0, 60, 1, 255));
    circle(this.pos.x, this.pos.y, this.mass);

    if (debug_mode) {
      fill(255, 0, 0);
      circle(this.destination.x, this.destination.y, this.mass);
      stroke(0);
      strokeWeight(1);
      line(this.pos.x, this.pos.y, this.destination.x, this.destination.y);
    }
  }
  age() {
    //beings age by 1 unit a day.
    if (world.time == 0 && frameCount % 60 == 0) {
      this.curr_age += 1;

      //as age increases, energy decreases; while mass increases.
      this.mass = this.get_mass();
      this.energy = this.get_energy();

      if (this.curr_age < 6 && this.curr_age > 1) {
        this.schedule = this.get_schedule();
      } else if (this.curr_age > 6 && this.curr_age < 60) {
        let n = Math.random();

        if (n > 0.5) this.schedule = this.get_schedule();
      } else if (this.curr_age > 60) {
        let n = Math.random();

        if (n < 0.25) this.schedule = this.get_schedule();
      }
    }
  }
  get_mass() {
    //for a given current age, calculate mass.

    //mass is an asymptotic-exponential-growth graph.

    const a = 10; //max.
    const b = 18; //in how many steps is max achieved.

    const mass =
      (a * (1 - Math.exp(-5 * (this.curr_age / b)))) / (1 - Math.exp(-5));

    return Math.round(mass * 100) / 100;
  }
  get_energy() {
    //energy is like a bell curve.

    /*
    https://www.desmos.com/calculator/3iioyvma2l

    f(x) = y = e^(-((x-a)^2) / b).
    */

    const m = 10;

    const energy =
      (1 / (1 + Math.exp(-(this.curr_age - 18) / 2))) *
      (1 / (1 + Math.exp((this.curr_age - 35) / 5))) *
      m;

    return Math.round(energy * 1000) / 1000;
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

    let speed = (this.energy / this.mass) * (d * 0.005);

    direction.mult(speed);
    this.pos.add(direction);

    this.constrain();
  }
  constrain() {
    if (
      this.pos.x + this.mass / 2 >= width ||
      this.pos.x - this.mass / 2 <= 0
    ) {
      this.speed.x *= -0.9;
    }
    if (
      this.pos.y + this.mass / 2 >= height ||
      this.pos.y - this.mass / 2 <= 0
    ) {
      this.speed.y *= -0.9;
    }
  }
  reproduce() {
    //beings in close proximity to each other give rise to another being.

    for (let being of world.beings) {
      if (being === this) continue; //can't reproduce yourself.
      if (this.curr_age < 18 || being.curr_age < 18 || this.curr_age > 45)
        continue;

      const d = p5.Vector.dist(this.pos, being.pos);
      const min_d = (this.mass + being.mass) / 2;

      let possible_times = this.schedule.map((slot) => slot[0]);

      if (d < min_d) {
        //probability is high (not 1) when between 18 - 30 and reduces afterwards and close to 0 after 40.
        let p =
          0.2 *
          (1 / (1 + Math.exp(-(this.curr_age - 18) / 2))) *
          (1 / (1 + Math.exp((this.curr_age - 40) / 2)));

        if (Math.random() < p) {
          world.beings.push(
            new Being(
              (this.pos.x + being.pos.x) / 2,
              (this.pos.y + being.pos.y) / 2,
              0,
            ),
          );
          break;
        }
      }
    }
  }
}
