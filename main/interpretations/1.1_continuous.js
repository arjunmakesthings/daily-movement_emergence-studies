/*
interpretation 1: 

thought: 
beings are destined to be with someone that they were born close (both in proximity & age) to. however, that may not be the case, and they may be separated in the world.

expression:
draw a line between a being & their partner over time. the closer they are, the stronger the line.

parameters: 
population = 1000; 
day length = 10;

# 260721.
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
  world = new World(width, height, 16, 5);
  world.initialize();

  //sort beings by age:
  const sorted = getProximitySortedBeings(world.beings);

  for (let i = 0; i < sorted.length - 1; i += 2) {
    pairs.push([sorted[i], sorted[i + 1]]);
  }

  for (let i = 0; i < pairs.length; i++) {
    pairs[i].push(i);
  }

  colorMode(HSL, pairs.length, 100, 100);

  diagonal = Math.hypot(height, width);

  background(pairs.length, 100, 100);

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

  // background (255);

  for (let i = 0; i < pairs.length; i++) {
    const first = pairs[i][0];
    const next = pairs[i][1];

    //get what you care about:
    const d = abs(first.pos.dist(next.pos));
    const avg_age = Math.floor((first.age + next.age) / 2);
    const sum_of_masses = first.mass / 2 + next.mass / 2;

    //the closer you are, the stronger the connection.
    // const a = map(d, sum_of_masses, diagonal - sum_of_masses, 0.9, 0.01);

    //diagonal was too much, and improbable.
    const a = map(d, sum_of_masses, width, 0.1, 0.001);

    //the younger you both are, the stronger you chances of being together:
    const sw = map(avg_age, 0, 80, 3, 1);

    draw_line(first.pos, next.pos, sw, a, i);
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
