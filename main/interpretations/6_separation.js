/*
interpretation #6: separation.

thought:
beings in different locations hold opposing views, and are separated over time. 

expression:
for each group of beings at a particular place, average out the direction that they arrived from, and treat it as an infinite line. for each of these lines, draw an orthogonal line between the place and its neighboring place in one of two colors. draw these lines over time.

parameters:
population: 500,
day_length: 48.

3rd october, 2026.
*/

let world;

const neighbours_n = 8; //how many places surround a place (its nearest).
const line_lengths = [0.8, 2.5]; //a separation line's length, as a share of the distance between the two places: at a place with one being, & at a full one.
const full_crowd = 10; //how many beings staying make a place full (its lines are longest; more don't make them longer).
const line_alpha = 5; //each line's strength (per frame): so, the more beings on a side, the stronger it gets.
//the two colours (democrat blue & republican red): each at the centre (darkest), & at the world's reach (lightest).
const colours = [
  { centre: [0, 20, 140], edge: [40, 80, 220] },
  { centre: [150, 10, 15], edge: [235, 40, 45] },
];

const shift = 0.15; //how far a being's line shifts off the average, along the gap (as a share of the distance between the two places).
const tilt = 0.12; //how far a being's line tilts off the orthogonal (radians).
const weights = [0.05, 0.8]; //a line's thickness: the least & the most.
const weight_mult = 1; //all lines' thickness, scaled: below 1 thinner, above 1 thicker.
const drift = 0.002; //how fast the noise drifts (per frame).

let surroundings = new Map(); //place -> the places that surround it.
let seeds = new WeakMap(); //being -> its own noise. (weak: the dead are let go of.)
let sides_taken = new WeakMap(); //being -> its colour (one of colours), chosen at random & kept.

function setup() {
  createCanvas(windowWidth, windowHeight);
  //accepts the following: (width, height, [population, day_length, max_mass, debug_mode])
  world = new World(width, height, 1000, 48);
  world.initialize();

  //places don't move; so, what surrounds each is worked out once.
  for (let place of world.places) {
    const others = world.places
      .filter((other) => other !== place)
      .sort(
        (a, b) =>
          p5.Vector.dist(place.pos, a.pos) - p5.Vector.dist(place.pos, b.pos),
      );
    surroundings.set(place, others.slice(0, neighbours_n));
  }

  background(255);
  noFill();
}

function draw() {
  world.run();

  //the beings staying at each place:
  const crowds = new Map();
  for (let being of world.beings) {
    if (being.state !== "staying" || !being.place) continue;
    if (!crowds.has(being.place)) crowds.set(being.place, []);
    crowds.get(being.place).push(being);
  }

  for (let [place, beings] of crowds) {
    //for each side (a surrounding place): the sum of its beings' directions, as doubled angles (so that opposite directions, on the same line, add up rather than cancel).
    const sides = new Map();

    for (let being of beings) {
      const dx = being.pos.x - place.pos.x;
      const dy = being.pos.y - place.pos.y;
      if (dx === 0 && dy === 0) continue; //right at the place: no direction.

      const angle = Math.atan2(dy, dx);
      const side = get_side(place, angle);

      if (!sides.has(side)) sides.set(side, { x: 0, y: 0, beings: [] });
      const sum = sides.get(side);
      sum.x += Math.cos(2 * angle);
      sum.y += Math.sin(2 * angle);
      sum.beings.push(being);
    }

    //the more beings at the place, the longer its lines:
    const fullness = constrain((beings.length - 1) / (full_crowd - 1), 0, 1);
    const line_length = lerp(line_lengths[0], line_lengths[1], fullness);

    for (let [side, sum] of sides) {
      //the average direction (a line), & the line orthogonal to it:
      const average = Math.atan2(sum.y, sum.x) / 2;
      const orthogonal = average + HALF_PI;

      //halfway between the place & the place on that side; & the gap's direction (to shift lines along):
      const gap = p5.Vector.dist(place.pos, side.pos);
      const mid_x = (place.pos.x + side.pos.x) / 2;
      const mid_y = (place.pos.y + side.pos.y) / 2;
      const gap_x = (side.pos.x - place.pos.x) / gap;
      const gap_y = (side.pos.y - place.pos.y) / gap;
      const half = (gap * line_length) / 2;

      //a line for each being on that side, nudged by its own noise:
      for (let being of sum.beings) {
        const seed = get_seed(being);
        const t = frameCount * drift;

        const off = (noise(seed, t) * 2 - 1) * shift * gap;
        const a = orthogonal + (noise(seed + 100, t) * 2 - 1) * tilt;
        const x = mid_x + gap_x * off;
        const y = mid_y + gap_y * off;

        stroke(...get_colour(place, being), line_alpha);
        strokeWeight(weight_mult * lerp(weights[0], weights[1], noise(seed + 200, t)));
        line(
          x - Math.cos(a) * half,
          y - Math.sin(a) * half,
          x + Math.cos(a) * half,
          y + Math.sin(a) * half,
        );
      }
    }
  }
}

/*
a being's own noise (where it reads from), kept.
*/
function get_seed(being) {
  if (!seeds.has(being)) seeds.set(being, random(1000));
  return seeds.get(being);
}

/*
the side of a place a direction faces: the surrounding place lying most in that direction.
*/
function get_side(place, angle) {
  let side = null;
  let closest = Infinity;

  for (let other of surroundings.get(place)) {
    const towards = Math.atan2(other.pos.y - place.pos.y, other.pos.x - place.pos.x);
    const off = Math.abs(Math.atan2(Math.sin(angle - towards), Math.cos(angle - towards)));

    if (off < closest) {
      side = other;
      closest = off;
    }
  }
  return side;
}

/*
a being's line colour: blue or red (its own, at random); the nearer its place is to the world's centre, the darker.
*/
function get_colour(place, being) {
  if (!sides_taken.has(being)) sides_taken.set(being, random(colours));
  const colour = sides_taken.get(being);

  const d = dist(place.pos.x, place.pos.y, world.bounds.w / 2, world.bounds.h / 2);
  const t = constrain(d / world.reach, 0, 1);

  return colour.centre.map((c, i) => lerp(c, colour.edge[i], t));
}
