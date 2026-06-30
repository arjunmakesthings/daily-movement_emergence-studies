class Being {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.curr_age = 0;
    this.mass = 0.1;
    this.energy = 0.1;
    this.speed = createVector(0, 0);

    this.schedule = this.get_schedule();

    this.destination = createVector(this.pos.x, this.pos.y);
  }
  get_schedule() {
    let avl_time = Array.from({ length: 24 }, (_, i) => i),
      schedule = [],
      i = 0;

    while (i < avl_time.length - 1) {
      i = (i + Math.floor(Math.random() * 6)) % avl_time.length;
      let a = avl_time.splice(i, 1)[0],
        b = avl_time.splice(i, 1)[0];
      schedule.push(
        schedule.length ? [schedule[schedule.length - 1][1], a] : [a, b],
      );
    }

    schedule.push([schedule[schedule.length - 1][1], schedule[0][0]]);
    return schedule;
  }
  exist() {
    this.body();
    this.age();
    if (this.curr_age > 1) {
      this.move();
    }
  }
  body() {
    fill(0);
    circle(this.pos.x, this.pos.y, this.mass);
  }
  age() {
    //beings age by 1 unit a day.
    if (world.time == 0 && frameCount % 60 == 0) {
      this.curr_age += 1;

      //as age increases, energy decreases; while mass increases.
      this.mass = this.get_mass();
      this.energy = this.get_energy();
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
    //move according to a schedule. 

    
    //temp case:
    let d = dist(
      this.pos.x,
      this.pos.y,
      this.destination.x,
      this.destination.y,
    );
    if (d < this.mass * 2) {
      this.destination = createVector(random(width), random(height));
    }

    let direction = p5.Vector.sub(this.destination, this.pos);
    direction.normalize();

    let speed = this.energy / this.mass;

    //debug stuff:
    // fill(255, 0, 0);
    // circle(this.destination.x, this.destination.y, this.mass);
    // stroke(0);
    // strokeWeight(speed);
    // line(this.pos.x, this.pos.y, this.destination.x, this.destination.y);

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
  }
}
