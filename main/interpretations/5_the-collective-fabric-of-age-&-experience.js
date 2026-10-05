/*
interpretation #5: the collective fabric of age & experience.

thought:
beings age and morph into more experienced beings over time. as they grow older, more beings are affected by their experience. we all live in the collective fabric of each other's experience. 

expression:
surround each being with a polygon. as they age, more nodes are added. therefore, younger ones are likely to be sharper; while older ones are likely to be rounder. as they age, expand the spread of the polygon & move it closer to white. note that the size of the polygons are far greater than the size of the world. 

parameters:
population: 1000,
day_length: 48. 

3rd october, 2026.
*/

let world;

const shapes = new WeakMap();

const shape_size = 600; //a polygon's radius, as a multiple of its being's mass.
const size_by_age = [0.1, 1.2]; //a polygon's size at age 0, & at 100 (& on): so, the older, the bigger (likely).
const impact_spread = 0.5; //how much beings' impact (a multiplier on size, of their own) varies: most are near 1, a few much bigger or smaller.

const form_bulge = 0.6; //how far a form strays from a circle (0: a circle).
const form_bulges = 1.2; //how many bulges a form has, around it.
const form_drift = 0.15; //how much a form shifts in a year.

const node_wander = 0.08; //how far each node wanders off its form, over time (as a share of the polygon's size).
const node_wander_speed = 0.002; //how fast nodes wander (per frame).

function setup() {
  createCanvas(windowWidth, windowHeight);
  //accepts the following: (width, height, [population, day_length, max_mass, debug_mode])
  world = new World(width, height, 1000, 48);
  world.initialize();

  background(255);
  noFill();
}

function draw() {
  world.run();

  const frame_of_day = frameCount % world.day_frames;

  for (let being of world.beings) {
    let shape = shapes.get(being);

    //a being we haven't seen yet: its form, and its nodes, grown to its age.
    if (!shape) {
      shape = {
        seed: random(1000),
        impact: Math.exp(randomGaussian(0, impact_spread)),
        angles: make_angles(being.age),
        due: plan_day(frame_of_day),
      };
      shapes.set(being, shape);
    }

    //a new day (a year older): when today's nodes come.
    if (world.new_day) shape.due = plan_day(0);

    //add the nodes that are due:
    while (shape.due.length && shape.due[0] <= frame_of_day) {
      shape.due.shift();
      add_node(shape.angles);
    }

    render(being, shape);
  }
}

/*
a triangle (roughly even, never exact); then, a year at a time, the nodes each year would have added.
*/
function make_angles(age) {
  const angles = [];
  for (let i = 0; i < 3; i++) {
    angles.push((i * TWO_PI) / 3 + random(-0.4, 0.4));
  }

  for (let year = 0; year < age; year++) {
    const n = Math.floor(random(1, 5));
    for (let k = 0; k < n; k++) add_node(angles);
  }
  return angles;
}

/*
1–4 moments in the rest of today (from a frame of the day), in order.
*/
function plan_day(from) {
  const n = Math.floor(random(1, 5));
  const due = [];
  for (let k = 0; k < n; k++) due.push(Math.floor(random(from, world.day_frames)));
  return due.sort((a, b) => a - b);
}

/*
add a node in a gap between two neighbouring nodes: wider gaps are likelier, so the nodes spread out evenly over time. it lands near the middle of its gap (not exactly), and displaces the polygon there: onto its form.
*/
function add_node(angles) {
  //the gap after each node, in radians:
  const gaps = angles.map((a, i) => {
    const next = angles[(i + 1) % angles.length];
    return (next - a + TWO_PI) % TWO_PI || TWO_PI;
  });

  //pick a gap, by its width:
  let r = random(TWO_PI);
  let i = 0;
  while (i < gaps.length - 1 && r > gaps[i]) {
    r -= gaps[i];
    i++;
  }

  const angle = (angles[i] + random(0.35, 0.65) * gaps[i]) % TWO_PI;
  angles.splice(i + 1, 0, angle);
}

/*
the form's radius at an angle (as a share of the polygon's size): a closed loop of noise, so it's smooth all the way round. it drifts with the being's age (and smoothly, through the day).
*/
function form(shape, angle, age) {
  const t = shape.seed + (age + world.clock / world.day_hours) * form_drift;
  const n = noise(
    shape.seed + cos(angle) * form_bulges,
    shape.seed + sin(angle) * form_bulges,
    t,
  );
  return 1 + form_bulge * (n - 0.5) * 2;
}

/*
a little noise over time, for each node (its own, keyed by its angle): it wanders a bit off its form, & back.
*/
function wander(shape, angle) {
  const n = noise(shape.seed + angle * 10, frameCount * node_wander_speed);
  return node_wander * (n - 0.5) * 2;
}

function render(being, shape) {
  //the older, the bigger (likely); but each being's impact makes some young ones big, & some old ones small.
  const grown = map(being.age, 0, 100, size_by_age[0], size_by_age[1], true);
  const r = being.mass * shape_size * grown * shape.impact;

  strokeWeight(0.5);
  //the younger, the darker; the older, the whiter (0: black, 100+: white).
  stroke(map(being.age, 0, 100, 0, 255, true), 100);

  beginShape();
  for (let angle of shape.angles) {
    const d = (form(shape, angle, being.age) + wander(shape, angle)) * r;
    vertex(being.pos.x + cos(angle) * d, being.pos.y + sin(angle) * d);
  }
  endShape(CLOSE);
}
