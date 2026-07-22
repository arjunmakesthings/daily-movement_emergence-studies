/*
260721.
pair interpolation shader.
*/

let world;
let pairs = [];
let pairShader;

const POPULATION = 2000;
const NUM_PAIRS = POPULATION / 2;

function preload() {
  pairShader = loadShader(
    "/main/interpretations/260715_born-love/vert.vert",
    "/main/interpretations/260715_born-love/frag.frag",
  );
}

function setup() {
  createCanvas(1000, 1000, WEBGL);

  world = new World(width, height, POPULATION, 3);
  world.initialize();

  const sorted = getProximitySortedBeings(world.beings);

  for (let i = 0; i < sorted.length - 1; i += 2) {
    pairs.push([sorted[i], sorted[i + 1]]);
  }

  noStroke();
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

  shader(pairShader);

  pairShader.setUniform("u_resolution", [width, height]);

  //flatten vec2 arrays
  let starts = [];
  let ends = [];
  let masses = [];

  for (let i = 0; i < NUM_PAIRS; i++) {
    let first = pairs[i][0];
    let second = pairs[i][1];

    starts.push(first.pos.x, first.pos.y);

    ends.push(second.pos.x, second.pos.y);

    masses.push(first.mass / 2 + second.mass / 2);
  }

  pairShader.setUniform("u_start", starts);

  pairShader.setUniform("u_end", ends);

  pairShader.setUniform("u_mass", masses);

  pairShader.setUniform("u_numPairs", NUM_PAIRS);

  rect(-width / 2, -height / 2, width, height);
}
