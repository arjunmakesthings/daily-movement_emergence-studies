//to test.

let world;

function setup() {
  createCanvas(1000, 1000);

  world = new World(width, height, 500, 50, 20, true);
  world.initialize();
}

function draw() {
  world.run();
}
