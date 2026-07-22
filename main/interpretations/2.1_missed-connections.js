/*
interpretation #2: missed connections.

thought: 
we walk by so many people. when they are within a certain distance, we have a short window of time to connect with each other in physical-space, until we are distant again. 

expression: 
draw a line from each being to other beings that are around them within a specific radius, with the distance between them signifying the intensity of a possible connection, over time.

parameters: 
population: 1000,
day_length: 10,

22nd july, 2026.
*/

let world;

function setup() {
  createCanvas(1000, 1000);
  //accepts the following: (width, height, [population, day_length, max_mass, debug_mode ])
  world = new World(width, height, 1000, 10, 4);
  world.initialize();

  background(255);
}

function draw() {
  background(255);

  world.run();

  for (let being of world.beings) {
    let neighbours = being.get_neighbours(being.mass * 2);

    for (neighbour of neighbours) {
      let d = being.pos.dist(neighbour.pos);

      let sw = map(
        d,
        being.mass / 2 + neighbour.mass / 2,
        being.mass * 2,
        1,
        0.1,
      );
      render(being.pos, neighbour.pos, sw);
    }
  }
}

function render(being_pos, other_pos, sw) {
  // strokeWeight(sw*2);
  // stroke(0);
  // point(being_pos.x, being_pos.y);
  // point(other_pos.x, other_pos.y);

  strokeWeight(sw);
  // stroke(0, 10);
  stroke(0);

  line(being_pos.x, being_pos.y, other_pos.x, other_pos.y);
}
