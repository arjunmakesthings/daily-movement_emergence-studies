//instantiate world with parameters.

let world;

function setup() {
  createCanvas(windowWidth, windowHeight);

  world = new World(width, height, 500, 48, 15, true);
  world.initialize();
}

function draw() {
  world.run();
}