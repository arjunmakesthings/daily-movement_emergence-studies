/*
interpretation #2.2: missed connections.

thought:
we walk by so many people. when they are within a certain distance, we have a short window of time to connect with each other in physical-space, until we are distant again.

expression:
every frame (cleared each time), draw a line from each being to other beings around them within 3 times its mass, but only when at least one of the two is travelling: walking by, not staying together at a place. the closer they are, the thicker the line (1 to 0.1), signifying the intensity of a possible connection.

parameters:
population: 1000,
day_length: 10,
max_mass: 4,

2nd october, 2026.
*/

let world;

function setup() {
  createCanvas(windowWidth, windowHeight);
  //accepts the following: (width, height, [population, day_length, max_mass, debug_mode ])
  world = new World(width, height, 1000, 10, 4);
  world.initialize();

  background(255);
}

function draw() {
  background(255);

  world.run();

  for (let being of world.beings) {
    let neighbours = being.get_neighbours(being.mass * 3);

    for (let neighbour of neighbours) {
      //only those walking by (beings staying together at a place aren't passing each other):
      if (being.state !== "travelling" && neighbour.state !== "travelling") continue;

      let d = being.pos.dist(neighbour.pos);

      let sw = map(
        d,
        being.mass / 2 + neighbour.mass / 2,
        being.mass * 3,
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
