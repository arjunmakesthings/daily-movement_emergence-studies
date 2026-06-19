class Being {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.curr_age = 0;
    this.mass = 10;
    this.energy = 100;

    this.schedule = new Array(24);
  }
  exist() {
    this.body();
    this.age();
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
      console.log(this.curr_age, this.mass);
    }
  }
  get_mass() {
    //for a given current age, calculate mass.

    const a = 50; //max.
    const b = 18; //in how many steps is max achieved.
    const base = 10;

    return a * (1-Math.exp(-5 * (this.curr_age / b))) / (1-Math.exp(-5)); 

    //return (a * (1 - Math.exp(-this.curr_age / b))) / (1 - Math.exp(-1));

    /*
    const a = 50;
const maxT = 18;

let t = this.curr_age / maxT;
t = Math.min(Math.max(t, 0), 1);

return a * (1 - Math.exp(-5 * t)) / (1 - Math.exp(-5));
    */
  }
  move() {
    //beings move according to a schedule.
  }
  reproduce() {
    //beings in close proximity to each other give rise to another being.
  }
}
