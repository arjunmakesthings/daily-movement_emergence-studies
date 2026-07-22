/*
what the interpretation is: 
each unit is connected to other beings. 

for each being, connect it to every other being; but based on distance, vary the stroke.

yymmdd.
*/

let world;

let diagonal = 0;

function setup() {
  createCanvas(1000, 1000);
  //accepts the following: (width, height, [population, day_length, debug_mode])
  world = new World(width, height, 200, 10);
  world.initialize();

  diagonal = Math.hypot(height, width);

  background(255);
}

function draw() {
  // background(255);
  world.run();

  for (let i = 0; i < world.beings.length; i++) {
    const main = world.beings[i];
    for (let j = 1; j < world.beings.length - 1; j++) {
      const other = world.beings[j];
      const d = main.pos.dist(other.pos);

      const sw = map(d, 0, diagonal, 1, 0.01);

      const diff_of_age = abs(main.age - other.age);

      const a = map(diff_of_age, 0, 80, 0.01, 1);

      draw_line(main.pos, other.pos, sw, a);
    }
  }
  // noLoop();
}

function draw_line(start, end, w, a) {
  stroke(0, a);
  strokeWeight(w);
  line(start.x, start.y, end.x, end.y);
}
