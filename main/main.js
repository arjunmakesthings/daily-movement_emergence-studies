/*
world; container; places; beings; time; movement; schedule; software-interpretation.
*/

let world;
let init_population = 50;
let day_length = 3;
let debug_mode = true;

function setup() {
  // createCanvas(windowWidth, windowHeight);
  createCanvas(800,800); 

  //p5 stuff; globally; once:
  noStroke();

  world = new World();
}

function draw() {
  world.run();

  if (debug_mode) {
    debug();
  }
}

function debug() {
  console.log(
    "time: " + world.time + "\n",
    "age: " + world.beings[0].curr_age + "\n",
    "mass: " + world.beings[0].mass + "\n",
    "energy: " + world.beings[0].energy + "\n",
    "schedule: " + world.beings[0].schedule + "\n",
    "destinations: " + world.beings[0].destination + "\n",
  );
}
