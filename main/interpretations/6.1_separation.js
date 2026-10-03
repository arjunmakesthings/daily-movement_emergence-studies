/*
interpretation #6.1: separation.

thought:
//

expression:
every frame, look at the beings staying at each place. for each of the places around it (its nearest) where beings are staying, a being grows a spike: a triangle as wide as its body, its apex pointing at the centre of the nearest being staying there. a spike reaches part of the way (a share of its own, for each pair of beings). spikes don't appear at once: a spike grows in (in length & opacity, eased) over a few seconds, turns smoothly when the nearest being changes, & fades back where it was when its being leaves or the place empties. beings themselves aren't drawn: only their spikes. each being's spikes are of its own shade, going smoothly from black to white & back (a cosine, at its own pace; so, as long near white as near black). spikes are faint, & lay over one another on white, slowly fading.

parameters:
population: 500,
day_length: 48.

3rd october, 2026.
*/

let world;

const neighbours_n = 6; //how many places surround a place (its nearest).
const reach = [0.2, 0.5]; //how far a spike reaches towards the other being (a share of the distance between them): the least & the most.

let surroundings = new Map(); //place -> the places that surround it.
const opacity = 50; //how opaque a spike is (per frame): so, spikes lay over one another.
const shade_period = 1200 * 4; //how many frames a being takes to go from black to white & back (each being's is within 25% of this).

const grow_frames = 180; //how many frames a spike takes to grow in (& to fade out).
const apex_ease = 0.02; //how quickly a spike turns towards where it's aimed (a share of the way, per frame).

let spikes = new Map(); //being -> (surrounding place -> its spike: { base, apex, grown, wanted }). kept while they grow & fade.
let reaches = new WeakMap(); //being -> (other being -> its spike's reach). (weak: the dead are let go of.)
let shades = new WeakMap(); //being -> where it is in its black-white cycle, & how fast it goes round.

function setup() {
  createCanvas(windowWidth, windowHeight);
  //accepts the following: (width, height, [population, day_length, max_mass, debug_mode])
  world = new World(width, height, 2000, 48);
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

  noStroke();

  background(255);
}

function draw() {
  world.run();

  // background(255, 20);

  //the beings staying at each place:
  const crowds = new Map();
  for (let being of world.beings) {
    if (being.state !== "staying" || !being.place) continue;
    if (!crowds.has(being.place)) crowds.set(being.place, []);
    crowds.get(being.place).push(being);
  }

  //the spikes there should be now: from each staying being, towards the nearest being at each surrounding place (where anyone's staying).
  for (let [place, beings] of crowds) {
    for (let being of beings) {
      if (!spikes.has(being)) spikes.set(being, new Map());
      const own = spikes.get(being);

      for (let other_place of surroundings.get(place)) {
        const others = crowds.get(other_place);
        if (!others) continue;

        const other = get_nearest(being, others);
        const share = get_reach(being, other);
        const apex = {
          x: being.pos.x + (other.pos.x - being.pos.x) * share,
          y: being.pos.y + (other.pos.y - being.pos.y) * share,
        };

        let spike = own.get(other_place);
        if (!spike) {
          spike = { base: { x: 0, y: 0 }, apex, grown: 0 };
          own.set(other_place, spike);
        }

        //the base sits on the body; the apex eases towards where it's aimed (so, it turns smoothly when the nearest being changes).
        spike.base.x = being.pos.x;
        spike.base.y = being.pos.y;
        spike.apex.x = lerp(spike.apex.x, apex.x, apex_ease);
        spike.apex.y = lerp(spike.apex.y, apex.y, apex_ease);
        spike.wanted = frameCount;
      }
    }
  }

  //spikes that are wanted grow in; the rest (their being left, or the place emptied) fade out, where they last were:
  for (let [being, own] of spikes) {
    const shade = 255 * get_shade(being);

    for (let [other_place, spike] of own) {
      spike.grown += (spike.wanted === frameCount ? 1 : -1) / grow_frames;
      spike.grown = constrain(spike.grown, 0, 1);

      if (spike.grown === 0) {
        own.delete(other_place);
        continue;
      }

      //eased (slow to start, slow to settle):
      const g = spike.grown * spike.grown * (3 - 2 * spike.grown);

      fill(shade, opacity * g);
      draw_spike(being, spike, g);
    }
    if (own.size === 0) spikes.delete(being);
  }
}

/*
a triangle from a being's body: its base across the body (as wide as it), its apex out towards the other being, as far as the spike has grown.
*/
function draw_spike(being, spike, g) {
  const dx = spike.apex.x - spike.base.x;
  const dy = spike.apex.y - spike.base.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d === 0) return;

  //across the spike (a unit vector):
  const cx = -dy / d;
  const cy = dx / d;
  const half = being.mass / 2;

  triangle(
    spike.base.x - cx * half,
    spike.base.y - cy * half,
    spike.base.x + cx * half,
    spike.base.y + cy * half,
    spike.base.x + dx * g,
    spike.base.y + dy * g,
  );
}

/*
how far a being's spike reaches towards another: a share of its own for each pair, kept (so it doesn't flicker).
*/
function get_reach(being, other) {
  if (!reaches.has(being)) reaches.set(being, new WeakMap());
  const shares = reaches.get(being);

  if (!shares.has(other)) shares.set(other, random(reach[0], reach[1]));
  return shares.get(other);
}

/*
a being's shade (0: black, 1: white): it goes round from black to white & back, smoothly (a cosine), at its own pace & from its own point. so, it spends as long near white as near black.
*/
function get_shade(being) {
  if (!shades.has(being)) {
    shades.set(being, {
      phase: random(TWO_PI),
      speed: TWO_PI / (shade_period * random(0.75, 1.25)),
    });
  }
  const shade = shades.get(being);

  return 0.5 - 0.5 * Math.cos(shade.phase + frameCount * shade.speed);
}

/*
of some beings, the one nearest to a being.
*/
function get_nearest(being, others) {
  let nearest = others[0];
  let nearest_d = Infinity;

  for (let other of others) {
    const d = being.get_distance(being.pos, other.pos);
    if (d < nearest_d) {
      nearest = other;
      nearest_d = d;
    }
  }
  return nearest;
}
