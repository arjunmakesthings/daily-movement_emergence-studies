class Being {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.curr_age = 1;
    this.mass = 1;
    this.energy = 0;

    this.velocity = createVector(0, 0);
    this.acceleration = createVector(0, 0);
    this.target = createVector(random(width), random(height)); // Random destination

    this.schedule = this.get_schedule();
  }
  get_schedule() {}
  exist() {
    this.body();
    this.age();
    this.move();
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
    // Calculate steering force toward target
    let desired = p5.Vector.sub(this.target, this.pos);
    let distance = desired.mag();

    // Pick a new random target if reached current one
    if (distance < 10) {
      this.target = createVector(random(width), random(height));
    }

    desired.normalize();
    desired.mult(this.energy); // Scale by energy

    this.apply_force(desired);
    // Change the velocity by the acceleration
    this.velocity.add(this.acceleration);

    // Change the position by the velocity
    this.pos.add(this.velocity);

    // Clear the acceleration each frame
    this.acceleration.mult(0);

    this.constrain();
  }
  constrain() {
    if (
      this.pos.x + this.mass / 2 >= width ||
      this.pos.x - this.mass / 2 <= 0
    ) {
      this.velocity.x *= -1;
      // Clamp position to stay within bounds
      this.pos.x = constrain(this.pos.x, this.mass / 2, width - this.mass / 2);
    }
    if (
      this.pos.y + this.mass / 2 >= height ||
      this.pos.y - this.mass / 2 <= 0
    ) {
      this.velocity.y *= -1;
      // Clamp position to stay within bounds
      this.pos.y = constrain(this.pos.y, this.mass / 2, height - this.mass / 2);
    }
  }
  apply_force(force) {
    //a = f*m.
    force.div(this.mass);
    this.acceleration.add(force);
  }
  reproduce() {
    //beings in close proximity to each other give rise to another being.
  }
}
