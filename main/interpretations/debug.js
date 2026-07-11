//instantiate world with parameters.

let world;

function setup() {
  createCanvas(1000, 1000);

  world = new World(width, height, 300, 10, 20, true);
  world.initialize(); 
}

function draw() {
  world.run();
}
