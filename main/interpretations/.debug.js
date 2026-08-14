//instantiate world with parameters.

let world;

function setup() {
  createCanvas(windowWidth, windowHeight);

  world = new World(width, height, 50, 10, 20, true);
  world.initialize();
}

function draw() {
  world.run();
}