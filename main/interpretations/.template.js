/*
interpretation #: title.

thought: 
//

expression: 
//

parameters: 
population:
day-length: 

xxth month, year.
*/

let world;

function setup() {
  createCanvas(1000, 1000);
  //accepts the following: (width, height, [population, day_length, debug_mode])
  world = new World(width, height, 300, 10);
  world.initialize();

  background (255); 
}

function draw() {
  world.run();

  for (let being of world.beings) {
    //draw:
  }
}
