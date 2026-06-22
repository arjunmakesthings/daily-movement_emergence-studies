class Being {
  constructor(x, y) {
    this.pos = createVector(x, y); 
    this.curr_age = 0;
    this.mass = 10;
    this.energy = 0;

    this.velocity = createVector(0,0); 

    this.schedule = this.get_schedule();
  }
  get_schedule(){

  }
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

      console.log(this.curr_age, this.mass, this.energy); 
    }
  }
  get_mass() {
    //for a given current age, calculate mass.

    //mass is an asymptotic-exponential-growth graph.

    const a = 50; //max.
    const b = 18; //in how many steps is max achieved.
    const base = 10;

    return (a * (1 - Math.exp(-5 * (this.curr_age / b)))) / (1 - Math.exp(-5));
  }
  get_energy(){
    //energy is like a bell curve.
    return 0.03 * this.curr_age * this.curr_age * Math.exp(-this.curr_age / 18);
  }
  move() {
    //beings move according to a schedule, with a speed that is a factor of their masses.
    this.pos.add(this.velocity); 

    this.constrain();
  }
  constrain(){
    if (this.pos.x+this.mass/2 >= width || this.pos.x - this.mass/2 <= 0){
      this.velocity.x*=-1;
    }
    if (this.pos.y + this.mass/2 > height || this.pos.y - this.mass/2 < 0) {
      this.velocity.y *= -1;
    }
  }
  reproduce() {
    //beings in close proximity to each other give rise to another being.
  }
}
