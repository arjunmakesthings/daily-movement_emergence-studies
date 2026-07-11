//to test.

let world;

function setup() {
  createCanvas(1000, 1000);

  world = new World(width, height, 300, 10, 20, true);
  world.initialize();
}

function draw() {

  background (255); 
  world.run();

  for (let being of world.beings) {
    const col = map(being.age, 0, 80, 0, 190);

    fill(col);

    circle(being.pos.x, being.pos.y, being.mass);
  }
}
