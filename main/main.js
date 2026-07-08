/*
world; container; places; beings; time; movement; schedule; software-interpretation.
*/

let world;

//vars to change:
let init_population = 2;
let day_length = 24;
let debug_mode = true;

function setup() {
  // createCanvas(windowWidth, windowHeight);
  createCanvas(800, 800);

  //p5 stuff; globally; once:
  noStroke();

  world = new World();
}

function draw() {
  world.run();

  debug_mode ? debug() : loop();
}

function debug(n = 0) {
  //show visually: 
  textSize(12); 
  noStroke(); 

  let tracked = world.beings[n]; 
  textAlign(CENTER);
  text ("[" + n + "]", tracked.pos.x + tracked.mass, tracked.pos.y + tracked.mass/2); 

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
