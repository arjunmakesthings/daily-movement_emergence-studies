/*
world; container; places; beings; time; movement; schedule; software-interpretation.
*/

let world;
let init_population = 10;
let day_length = 24;
let debug_mode = true;

function setup() {
  createCanvas(800, 800); //square.

  //p5 stuff; globally; once:
  noStroke();

  world = new World();
}

function draw() {
  world.exist();

  if (debug_mode) {
    debug();
  }
}

function debug() {
  console.log(
    "time: " + world.time,
    "age: " + world.beings[0].curr_age,
    "mass: " + world.beings[0].mass,
    "energy: " + world.beings[0].energy,
    "schedule: " + world.beings[0].schedule,
	"destinations: " + world.beings[0].destination
  );
}
