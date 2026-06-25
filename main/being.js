class Being {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.curr_age = 1;
    this.mass = 1;
    this.energy = 0;
    this.speed = createVector(1, 1);

    this.schedule = this.get_schedule();
  }
  get_schedule() {}
  exist() {
    this.body();
    this.age();
    // this.move();
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

    return (a * (1 - Math.exp(-5 * (this.curr_age / b)))) / (1 - Math.exp(-5));
  }
  get_energy() {
    //energy is like a bell curve.

    /*
    https://www.desmos.com/calculator/3iioyvma2l

    f(x) = y = e^(-((x-a)^2) / b).
    */

    const m = 10;

    return (
      (1 / (1 + Math.exp(-(this.curr_age - 18) / 2))) *
      (1 / (1 + Math.exp((this.curr_age - 35) / 5))) *
      m
    );
  }
  move() {
    //beings move according to a schedule, with a speed that is a factor of their masses & energy.
    this.pos.add(this.speed);

    this.constrain();
  }
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
  reproduce() {
    //beings in close proximity to each other give rise to another being.
  }
}
