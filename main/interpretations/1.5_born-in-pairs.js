/*
interpretation #1.5: born in pairs. 

thought: 
beings are destined to be with someone that they were born close to (in proximity & age). however, as they live out their lives, they may be close or separated in the world. thought is borrowed from the red thread of fate.

(ideology borrowed from: red thread of fate -> https://en.wikipedia.org/wiki/Red_thread_of_fate.)

expression:
draw a set of red lines between a being & the person that they're "destined" to be with, over time. the closer they are to each other, the more red lines are drawn, & the stronger they are (in colour and density). 

parameters: 
population = 4 (shown); 
day length = 10;

# 260730.
*/

let world;

/*
we make pairs at birth. when beings die, 

pairs = [[being 1, being 2]]. 
*/

let pairs = [];

let diagonal = 0;
// const sw = 0.1;

function setup() {
  createCanvas(windowWidth, windowHeight);
  //accepts the following: (width, height, [population, day_length, debug_mode])
  world = new World(width, height, 200, 10);
  world.initialize();

  //sort beings by age:
  const sorted = getProximitySortedBeings(world.beings);

  for (let i = 0; i < sorted.length - 1; i += 2) {
    pairs.push([sorted[i], sorted[i + 1]]);
  }

  diagonal = Math.hypot(height, width);

  //set color mode with upper bounds:
  colorMode(HSL, 360, 100, 100, 1);

  background(100, 100, 100);

  // black-ish:
  // background(355, 8, 2);

  noFill();
}

//helper to sort:
function getProximitySortedBeings(beings) {
  // Create a shallow copy so we don't mutate the original array
  let remaining = [...beings];
  let result = [];

  if (remaining.length === 0) return [];

  // Start with the first being in the list as our starting point
  let current = remaining.shift();
  result.push(current);

  while (remaining.length > 0) {
    let bestIndex = -1;
    let minDistance = Infinity;
    let minAgeDiff = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i];

      // Use p5's .dist() method for calculating distance between vectors
      const d = current.pos.dist(candidate.pos);

      // Logic: Find the closest being.
      // If distances are identical, pick the one with the closer age to 'current'.
      if (d < minDistance) {
        minDistance = d;
        minAgeDiff = Math.abs(candidate.age - current.age);
        bestIndex = i;
      } else if (d === minDistance) {
        const ageDiff = Math.abs(candidate.age - current.age);
        if (ageDiff < minAgeDiff) {
          minAgeDiff = ageDiff;
          bestIndex = i;
        }
      }
    }

    // Remove the winner from 'remaining' and add it to our result chain
    const nextWinner = remaining.splice(bestIndex, 1)[0];
    result.push(nextWinner);

    // The next search starts from the being we just added
    current = nextWinner;
  }

  return result;
}

function draw() {
  world.run();

  // background(190);
  for (let i = 0; i < 2; i++) {
    const a = pairs[i][0];
    const b = pairs[i][1];

    const d = Math.floor(p5.Vector.dist(a.pos, b.pos));

    const min_d = Math.floor(a.mass / 2 + b.mass / 2);
    diagonal = Math.hypot(height, width);
    const max_d = Math.floor(width / 2);
    // const max_rad = (a.mass + b.mass) * (width*4 / world.beings.length);

    //for debug:
    // const poc = p5.Vector.add(a.pos, b.pos).div(2);
    // show_reach(poc, min_rad, 0);
    // show_reach(poc, max_rad, 1);

    // const sc = constrain(map(d, min_rad, max_rad, 100, 0), 0, 100);
    // const sw = constrain(map(d, min_rad, max_rad, 2, 1), 1, 2);

    // const sc_hsl = color(0, sc, 50);
    // sc_hsl.setAlpha(1);

    // strokeWeight(1);
    // stroke(sc_hsl);
    // line(a.pos.x, a.pos.y, b.pos.x, b.pos.y);

    //normalize distance:

    let n = Math.floor(map(d, min_d + 1, max_d, 10, 2));

    const dir = p5.Vector.sub(b.pos, a.pos).normalize();
    const normal = createVector(-dir.y, dir.x); // 90° rotation

    let sw = map(d, min_d, max_d, 1, 0.01);

    const spacing = sw + sw * 0.75;

    for (let j = 0; j < n; j++) {
      // center the bundle around the original line
      const offset = (j - (n - 1) / 2) * spacing;

      const off = p5.Vector.mult(normal, offset);

      let sat = Math.floor(map(d, min_d, max_d, 100, 1));
      let light = Math.floor(map(d, min_d, max_d, 30, 110));

      const a2 = p5.Vector.add(a.pos, off);
      // draw_point(a2, sat, light);
      const b2 = p5.Vector.add(b.pos, off);
      // draw_point(b2, sat, light);

      const a_noise = noise(a2.x * a2.y) * 10;
      a2.add(a_noise);
      const b_noise = noise(b2.x * b2.y) * 10;
      b2.add(b_noise);

      draw_line(a2, b2, sw, sat, light);
    }
  }

  // noLoop();
}

function draw_line(start, end, sw, sat, light) {
  strokeWeight(sw);
  stroke(355, sat, light, 0.5);
  line(start.x, start.y, end.x, end.y);
}

function draw_point(pos, sat, light) {
  strokeWeight(1);
  // stroke(355, sat, light, 1);
  stroke(0, 0, 0, 0.03);
  point(pos.x, pos.y);
}

//debug helper:
function show_reach(pos, rad, m) {
  noFill();
  strokeWeight(1);

  m == 0 ? stroke(0, 255, 0) : stroke(255, 0, 0);

  circle(pos.x, pos.y, rad);
}
