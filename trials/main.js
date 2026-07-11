/*
world; container; places; beings; time; movement; schedule; software-interpretation.
*/

let world;

//vars to change:
let init_population = 300;
let day_length = 10;
let debug_mode = false;

const maximum_mass = 20;

function setup() {
  // createCanvas(windowWidth, windowHeight);
  createCanvas(800, 800);

  // world = new World();
  world = new World(width, height, 300, 10, 20, false);
  world.initialize();
}

function draw() {
  world.run();

  if (debug_mode) debug();
}

function debug(n = 0) {
  //show visually:
  textSize(12);
  noStroke();
  fill(255, 0, 0);

  let tracked = world.beings[n];
  textAlign(CENTER);
  text(
    "[" + n + "]",
    tracked.pos.x + tracked.mass * 1.5,
    tracked.pos.y + tracked.mass / 2,
  );

  console.log(
    "beings[" + n + "]" + "\n",
    "time: " + world.time + "\n",
    "age: " + tracked.age + "\n",
    "mass: " + tracked.mass + "\n",
    "energy: " + tracked.energy + "\n",
    "schedule: " + tracked.schedule + "\n",
    "destinations: " +
      tracked.destination.x +
      ", " +
      tracked.destination.y +
      "\n",
  );
}
