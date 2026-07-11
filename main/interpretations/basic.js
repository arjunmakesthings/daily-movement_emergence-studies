//instantiate world with parameters.

let world;

function setup() {
  createCanvas(1000, 1000);

  world = new World(width, height, 300, 10, 20, false);
  world.initialize();
}

function draw() {
  world.run();

  for (let being of world.beings) {
    const col = map(being.age, 0, 80, 0, 190);

    fill(col);

    circle(being.pos.x, being.pos.y, being.mass);
  }
}
