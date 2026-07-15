/*
what the interpretation is: 

yymmdd.
*/

let world;

function setup() {
  createCanvas(1000, 1000);
  world = new World(width, height, 300, 10, 20, false);
  world.initialize();
}

function draw() {
  world.run();

  for (let being of world.beings) {
    
  }
}
