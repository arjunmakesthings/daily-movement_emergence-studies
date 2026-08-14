/*
interpretation #1.3: born in pairs. 

thought: 
beings are destined to be with someone that they were born close (in proximity & age) to. however, as they live out their lives, they may be close or separated in the world. ideology borrowed from: red thread of fate -> https://en.wikipedia.org/wiki/Red_thread_of_fate. 

expression:
draw a red line between a being & the person they're supposed to be with over time. the closer they are, the more intense the line; and vice-versa.

parameters: 
population = 40; 
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

function setup() {
  createCanvas(1000, 1000);
  //accepts the following: (width, height, [population, day_length, debug_mode])
  world = new World(width, height, 100, 10);
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

  for (let i = 0; i < pairs.length; i++) {
    const a = pairs[i][0];
    const b = pairs[i][1];

    const d = p5.Vector.dist(a.pos, b.pos);

    const min_rad = a.mass / 2 + b.mass / 2;
    const max_rad = width / 2;
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
    const t = constrain(map(d, min_rad, max_rad, 1, 0), 0, 1);

    const hue = 355;
    const sat = lerp(45, 95, t);
    const light = lerp(22, 48, t);

    // very transparent so threads accumulate
    const alpha = lerp(0.001, 0.01, t);

    // stroke(color(hue, sat, light, alpha));

    strokeWeight(2);
    let bounce = map(sin(i), -1, 1, 0, 100);
    stroke(0, 0, bounce, 0.05);
    point(a.pos.x, a.pos.y);
    point(b.pos.x, b.pos.y);

    // slightly thicker when close
    strokeWeight(lerp(0.1, 0.5, t));

    for (let j = 0; j < 3; j++) {
      const ox = random(-0.4, 0.4);
      const oy = random(-0.4, 0.4);

      stroke(color(hue, sat, light, alpha));
      line(a.pos.x + ox, a.pos.y + oy, b.pos.x + ox, b.pos.y + oy);
    }

    // line(a.pos.x, a.pos.y, b.pos.x, b.pos.y);
  }

  // noLoop();
}

function draw_line(start, end, w = 1, a = 100, c) {
  const col = color(c, 100, 50);
  col.setAlpha(a);
  stroke(col);
  strokeWeight(w);
  line(start.x, start.y, end.x, end.y);
}

//debug helper:
function show_reach(pos, rad, m) {
  noFill();
  strokeWeight(1);

  m == 0 ? stroke(0, 255, 0) : stroke(255, 0, 0);

  circle(pos.x, pos.y, rad);
}
