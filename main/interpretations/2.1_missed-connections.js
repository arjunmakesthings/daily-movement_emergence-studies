/*
interpretation #2: missed connections.

thought: 
we walk by so many people. when they are within a certain distance, we have a short window of time to connect with each other in physical-space, until we are distant again. 

expression: 
draw a line from each being to other beings around them within a specific radius, with the distance between them signifying the intensity of a possible connection, over time. connections are wiped out, however, by the movement of beings.

parameters: 
population: 1000,
day_length: 10,

22nd july, 2026.
*/

let world;

function setup() {
  createCanvas(1000, 1000);
  //accepts the following: (width, height, [population, day_length, max_mass, debug_mode ])
  world = new World(width, height, 300, 10, 2);
  world.initialize();

  background(0);
}

function draw() {
  // background(255);

  world.run();

  for (let being of world.beings) {
    let neighbours = being.get_neighbours(being.mass * 4);

    for (neighbour of neighbours) {
      let d = being.pos.dist(neighbour.pos);

      let sw = map(
        d,
        being.mass / 2 + neighbour.mass / 2,
        being.mass * 4,
        2,
        0.1,
      );
      render(being.pos, neighbour.pos, sw);
    }
  }
}

function render(being_pos, other_pos, sw) {
  stroke(0);
  strokeWeight(sw * 2);
  point(being_pos.x, being_pos.y);

  stroke(255, 10);
  strokeWeight(sw);
  line(being_pos.x, being_pos.y, other_pos.x, other_pos.y);
}
