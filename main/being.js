class Being {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.curr_age = 0;
    this.mass = 20;
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
    if (world.time == 0 && frameCount % 60 == 0) {
      //on this planet, beings age by 1 unit per day.
      this.curr_age++;
    }
  }
  move() {

  }
  reproduce(){

  }
}
