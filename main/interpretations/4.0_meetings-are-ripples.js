/*
interpretation #4: meetings are ripples.

thought: 
meeting people can be resounding. when two beings meet, a ripple is sent through in space & time; that affect other beings. 

expression: 
when two beings collide, create a circular ripple that expands from the point of collision. the strength of the ripplle is random, and reduces as it spreads outwards. 

parameters: 
population:
day-length: 

27th july, 2026.
*/

let world;

function setup() {
  createCanvas(1000, 1000);
  //accepts the following: (width, height, [population, day_length, max_mass, debug_mode])
  world = new World(width, height, 300, 10, 50);
  world.initialize();

  background(255);
}

function draw() {
  world.run();

  background(255);

  for (let being of world.beings) {
    let neighbours = being.get_neighbours(6);

    if (neighbours.length < 1) {
      continue;
    } else {
      for (let neighbour of neighbours) {
        const cp = (p5.Vector.add(being.pos, neighbour.pos)).div(2);
        strokeWeight(2);
        stroke(255, 0, 0);

        point(being.pos.x, being.pos.y);
        point(neighbour.pos.x, neighbour.pos.y);

        stroke(0);
        point(cp.x, cp.y);
        console.log(cp);
        noLoop();
        make_ripples();
      }
    }
  }
}

function make_ripples() {}

//debug to see neighbours:
function show_neighbours(p) {
  strokeWeight(2);
  stroke(0);

  point(p.x, p.y);
}
