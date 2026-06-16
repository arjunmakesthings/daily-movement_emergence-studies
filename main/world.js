class World {
  constructor() {
    this.beings = [];

    for (let i = 0; i < 50; i++) {
      this.beings.push(
        new Being(random(50, width - 50), random(50, height - 50)),
      );
    }

    //this.beings.push(new Being(width / 2, height / 2)); //debug being.

    this.time = 0;
    this.killing_time = 0;
  }
  exist() {
    background(255);

    this.keep_time();

    this.kill();

    for (let being of this.beings) {
      being.exist();
    }
  }
  keep_time() {
    //on this world, time is a 24-second loop.
    this.time = Math.floor((frameCount / 60) % 5);
  }
  kill() {
    //as beings age, their probability to die increases. therefore, it is almost imminent if they are 1000.

    if (this.time == 0){
        //find a new killing time for the day:
        this.killing_time = Math.round(Math.random(0, 5)); 
    }

    if (this.time == this.killing_time){
      for (let i = 0; i < this.beings.length; i++) {
        let chance = Math.random().toFixed(2);
        let p = this.beings[i].curr_age / 1000;

        console.log(chance, p);

        if (p > chance) {
          this.beings.splice(i, 1);
          console.log("killed");
        }
      }
    }
  }
}
