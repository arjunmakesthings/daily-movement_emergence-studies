/*
analysis of the base simulation: the new system (./main/system/) against the old one (./main/system/old/).

it uses the real systems, in three ways:
1. the math: make many beings at every age, and graph what each system gives them (energy, speed, busyness, probability of dying, lifespan).
2. the simulation: run a world of each system for some days, and graph what actually happens.
3. many cases: repeat the main checks across many worlds (sizes, populations, day-lengths, max-masses).

noise is intended: so, everything is shown as a spread (median, 25–75%, 5–95%), and the odds of unlikely things are counted, not hidden.

the new system is blue & solid; the old one is orange & dashed, everywhere.
*/

let world; //the systems read this global.

const AGES = Array.from({ length: 101 }, (_, i) => i);

/*
----------------------------------------
the systems:
----------------------------------------
*/

/*
both systems name their classes World & Being, so they can't both be loaded with <script> tags. each is fetched, and run in its own scope (see load_systems).

the old system keeps less on its beings (no busyness, state, vigor, or probability of dying), so each system says how its beings are measured.
*/
const SYSTEMS = {
  new: {
    name: "new",
    dir: "../../../main/system/",
    color: "--series-1",
    dashed: false,
    day_frames: () => world.day_frames,
    day_hours: () => world.day_hours, //a day is always 24 hours; day_length sets how many seconds it lasts.
    places: () => world.places.map((place) => place.pos),
    spacing: () => world.place_spacing,
    speed: (b) => b.get_speed(),
    wished: (b) => b.busyness,
    planned: (b) => b.destinations.length,
    one_place: (b) => b.destinations.length === 1,
    vigor: (b) => b.maxes.vigor,
    death: (b) => b.get_death_chance(),
    travelling: (b) => b.state === "travelling",
    heading_for: (b) => b.place, //the place it's heading for, or staying at.
    rounds: true, //beings reproduce in rounds, & a pair has one child per round.
  },
  old: {
    name: "old",
    dir: "../../../main/system/old/",
    color: "--series-2",
    dashed: true,
    day_frames: () => 60 * world.day_length, //old world.keep_time: an hour is 60 frames,
    day_hours: () => world.day_length, //& a day is day_length hours.
    places: () => world.hotspots.map(([x, y]) => ({ x, y })),
    //the old world doesn't keep a spacing; its hotspots lie on the same spiral as the new places, so it's measured the same way:
    spacing: () => 0.45 * Math.min(world.bounds.w, world.bounds.h) * Math.sqrt(Math.PI / world.hotspots.length),
    speed: (b) => (b.age > 1 ? b.energy / b.mass : null), //as in old move(), where speed_mult is never applied. (beings under 2 don't move.)
    wished: (b) => old_wish(b.age),
    planned: (b) => b.schedule.filter(([start]) => Number.isInteger(start)).length, //slots past the day's hours get no start hour, & never come.
    one_place: (b) => new Set(b.destinations.map((d) => d.x + "," + d.y)).size === 1, //its random hotspots may all be the same one.
    vigor: () => null, //old beings have no vigor.
    death: (b) => 0.0002 + 0.12 * Math.pow(constrain(b.age / 100, 0, 1), 3), //copied from old world.kill_and_make_beings.
    travelling: (b) => b.pos.dist(b.destination) >= b.mass, //old move(): a being has arrived when it's within its mass.
    heading_for: (b) => b.destination.x + "," + b.destination.y, //a p5.Vector, which old move() changes in place; so, its position.
    rounds: false,
  },
};
const SYSTEM_LIST = Object.values(SYSTEMS);

let sys; //the system being measured.

/*
fetch each system's world.js & being.js, and run them in their own scope; the classes they define are kept on the system.
*/
async function load_systems() {
  for (const s of SYSTEM_LIST) {
    const files = await Promise.all(
      ["world.js", "being.js"].map(async (file) => {
        const res = await fetch(s.dir + file);
        if (!res.ok) throw new Error(`couldn't load ${s.dir + file}`);
        return res.text();
      }),
    );
    Object.assign(s, new Function(files.join("\n") + "\nreturn { World, Being };")());
  }
}

/*
the old system doesn't keep how many places a being wishes for; it's drawn inside old being.get_schedule. this is that draw, copied.
*/
function old_wish(age) {
  const min = 2;
  const max = 12;
  const peak = 25;
  const sigma = 10;

  const g = Math.exp(-Math.pow(age - peak, 2) / (2 * sigma * sigma));
  const mean_busyness = min + (max - min) * g;
  const spread = 1.25 + (1 - g) * 3.5;

  return constrain(Math.round(randomGaussian(mean_busyness, spread)), min, max);
}

function setup() {
  createCanvas(1, 1).hide(); //the systems need p5 running; nothing is drawn.
  noLoop();

  document.querySelector("#run").addEventListener("click", run);
  run();
}

/*
----------------------------------------
helpers:
----------------------------------------
*/

//the systems read p5's frameCount; we drive it ourselves.
function set_frame(f) {
  window.frameCount = f;
}

function make_world(c) {
  set_frame(0);
  //the old system keeps beings inside p5's width & height (the canvas), not the world's bounds; so the canvas is the world's size.
  resizeCanvas(c.w, c.h, true);
  world = new sys.World(c.w, c.h, c.pop, c.day, c.mm);
  return world;
}

function quantiles(values) {
  const s = [...values].sort((a, b) => a - b);
  const q = (p) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
  return { p5: q(0.05), p25: q(0.25), p50: q(0.5), p75: q(0.75), p95: q(0.95) };
}

function median(values) {
  return quantiles(values).p50;
}

//group rows by a key (e.g. age), then take quantiles of a value per group.
function band(rows, x_key, y_key, xs) {
  const groups = new Map(xs.map((x) => [x, []]));
  for (const r of rows) {
    const v = r[y_key];
    if (v === null || v === undefined || !groups.has(r[x_key])) continue;
    groups.get(r[x_key]).push(v);
  }
  return xs.filter((x) => groups.get(x).length).map((x) => ({ x, ...quantiles(groups.get(x)) }));
}

//group rows by a key, then take the mean of a value per group (for small whole numbers, where medians & bands are blocky).
function mean_by(rows, x_key, y_key, xs) {
  return band(rows, x_key, y_key, xs).map((p) => {
    const values = rows.filter((r) => r[x_key] === p.x && r[y_key] !== null).map((r) => r[y_key]);
    return { x: p.x, p50: values.reduce((a, b) => a + b, 0) / values.length };
  });
}

//the chance that a random `a` beats a random `b`.
function chance_greater(a, b) {
  let wins = 0;
  for (const x of a) for (const y of b) if (x > y) wins++;
  return wins / (a.length * b.length);
}

function pct(v, digits = 1) {
  return (100 * v).toFixed(digits) + "%";
}

function next_tick() {
  return new Promise((resolve) => setTimeout(resolve));
}

function read_config() {
  const n = (id) => Number(document.querySelector("#" + id).value);
  return {
    w: n("w"),
    h: n("h"),
    pop: n("pop"),
    day: n("day"),
    mm: n("mm"),
    days: n("days"),
    per_age: n("per_age"),
  };
}

function status(msg) {
  document.querySelector("#status").textContent = msg;
}

/*
----------------------------------------
1. the math:
----------------------------------------
*/

/*
make many beings at each age (at a random place), and record what the system gives each of them.
*/
function sample_by_age(c, per_age) {
  make_world(c);
  const places = sys.places();
  const rows = [];

  for (const age of AGES) {
    for (let k = 0; k < per_age; k++) {
      const place = random(places);
      const b = new sys.Being(place.x, place.y, age);
      const moves = age > 1; //beings under 2 don't move.

      rows.push({
        age,
        energy: b.energy,
        speed: sys.speed(b),
        busyness: sys.wished(b),
        planned: moves ? sys.planned(b) : null,
        one_place: moves ? sys.one_place(b) : null,
        vigor: sys.vigor(b),
        death: sys.death(b),
      });
    }
  }
  return rows;
}

/*
lifetimes from the death math: a being is alive at an age if it survived every day (a day is a year) before it.
returns the share alive at each age; and, for a system with vigor, the same per vigor third (low, middle, high).
*/
function survival(c, n) {
  make_world(c);
  const lives = [];

  for (let k = 0; k < n; k++) {
    const b = new sys.Being(c.w / 2, c.h / 2, 0);
    const alive = [];
    let s = 1;
    for (const age of AGES) {
      alive.push(s);
      b.age = age;
      s *= 1 - Math.min(1, sys.death(b));
    }
    lives.push({ vigor: sys.vigor(b), alive });
  }

  const curve = (group) => AGES.map((age, i) => group.reduce((sum, l) => sum + l.alive[i], 0) / group.length);
  const out = { all: curve(lives) };
  if (lives[0].vigor === null) return out;

  lives.sort((a, b) => a.vigor - b.vigor);
  const third = Math.floor(n / 3);
  out.low = curve(lives.slice(0, third));
  out.middle = curve(lives.slice(third, 2 * third));
  out.high = curve(lives.slice(2 * third));
  return out;
}

function median_lifespan(curve) {
  const i = curve.findIndex((s) => s < 0.5);
  return i === -1 ? ">100" : String(i);
}

/*
----------------------------------------
2. the simulation:
----------------------------------------
*/

async function simulate(c, on_day) {
  make_world(c);
  world.initialize();

  const day_frames = sys.day_frames();
  const warm_up = 3; //days: beings start at random spots; let them settle into their days.

  const out = {
    population: [],
    lives: [],
    deaths: [],
    most_children_per_round: sys.rounds ? 0 : null,
    moving: [], //share of beings travelling, over the last 2 days.
    departures: new Array(day_frames).fill(0), //departures, by frame of the day.
  };
  const travelling = new Map(); //being -> frames spent travelling today.
  const reached = new Map(); //being -> places reached today.

  //a trip starts when a being's destination changes, & ends the first time it arrives there. (in the old system, beings jostled out of a crowd walk back without having left.)
  const heading_for = new Map(); //being -> its destination, last frame.
  const been_to = new Map(); //being -> the destination it last arrived at.

  //watch reproduction (in a system with rounds): in one round, no being should be a parent twice.
  const proto = sys.Being.prototype;
  const reproduce = proto.reproduce;
  let parents_this_frame = new Map();
  if (sys.rounds) {
    proto.reproduce = function (unavailable) {
      const before = new Set(unavailable);
      const child = reproduce.call(this, unavailable);
      if (child) {
        for (const parent of unavailable) {
          if (before.has(parent)) continue;
          const count = (parents_this_frame.get(parent) || 0) + 1;
          parents_this_frame.set(parent, count);
          out.most_children_per_round = Math.max(out.most_children_per_round, count);
        }
      }
      return child;
    };
  }

  try {
    for (let day = 0; day < c.days; day++) {
      for (let f = 1; f <= day_frames; f++) {
        set_frame(day * day_frames + f);
        parents_this_frame = new Map();

        const before = world.beings.slice();
        world.run();

        //who died (in the old system, deaths can come on any frame of the killing hour):
        if (day >= warm_up) {
          const now = new Set(world.beings);
          for (const b of before) {
            if (!now.has(b)) out.deaths.push({ age: b.age });
          }
        }

        let moving = 0;
        let able = 0; //beings old enough to move.
        for (const b of world.beings) {
          if (b.age < 2) continue;
          able++;

          const now = sys.travelling(b);
          if (now) {
            moving++;
            travelling.set(b, (travelling.get(b) || 0) + 1);
          }

          const dest = sys.heading_for(b);
          if (heading_for.has(b) && heading_for.get(b) !== dest && day >= warm_up) out.departures[f - 1]++;
          heading_for.set(b, dest);

          if (!now && been_to.get(b) !== dest) {
            been_to.set(b, dest);
            reached.set(b, (reached.get(b) || 0) + 1);
          }
        }
        if (day >= c.days - 2 && f % 5 === 0) {
          out.moving.push({ x: +((day - (c.days - 2) + f / day_frames) * 24).toFixed(2), p50: moving / able }); //in hours of a 24-hour day (the old system's days, mapped to 24 hours).
        }
      }

      //at the end of each day, record each being's day:
      out.population.push({ x: day + 1, p50: world.beings.length });
      if (day >= warm_up) {
        for (const b of world.beings) {
          if (b.age < 2) continue;
          out.lives.push({
            age_bin: Math.min(80, 5 * Math.floor(b.age / 5)),
            age: b.age,
            planned: sys.planned(b),
            reached: reached.get(b) || 0,
            nowhere: !reached.get(b),
            travelling: (travelling.get(b) || 0) / day_frames,
          });
        }
      }
      travelling.clear();
      reached.clear();

      on_day(day + 1);
      await next_tick();
    }
  } finally {
    proto.reproduce = reproduce;
  }

  return out;
}

/*
----------------------------------------
3. many cases:
----------------------------------------
*/

const CASES = [
  { w: 1440, h: 900, pop: 500, day: 5, mm: 10 },
  { w: 1920, h: 1080, pop: 500, day: 5, mm: 10 },
  { w: 1440, h: 900, pop: 50, day: 10, mm: 20 },
  { w: 1000, h: 1000, pop: 300, day: 10, mm: 4 },
  { w: 1000, h: 1000, pop: 300, day: 10, mm: 10 },
  { w: 1000, h: 1000, pop: 300, day: 10, mm: 30 },
  { w: 1000, h: 1000, pop: 1000, day: 10, mm: 4 },
  { w: 1000, h: 1000, pop: 500, day: 10, mm: 30 },
  { w: 1000, h: 1000, pop: 300, day: 24, mm: 10 },
  { w: 2560, h: 1440, pop: 200, day: 24, mm: 10 },
];

function summarise_case(c, per_age) {
  const rows = sample_by_age(c, per_age);
  const of = (lo, hi) => rows.filter((r) => r.age >= lo && r.age <= hi);
  const one_place = (rs) => rs.filter((r) => r.one_place).length / rs.length;

  return {
    c,
    speed_25: median(of(23, 27).map((r) => r.speed)),
    spacing: sys.spacing(),
    wish_25: median(of(23, 27).map((r) => r.busyness)),
    planned_25: median(of(23, 27).map((r) => r.planned)),
    one_young: one_place(of(18, 35)),
    one_middle: one_place(of(36, 59)),
    one_old: one_place(of(60, 100)),
    old_busier: chance_greater(of(58, 62).map((r) => r.planned), of(21, 25).map((r) => r.planned)),
  };
}

/*
----------------------------------------
the page:
----------------------------------------
*/

async function run() {
  const c = read_config();
  const button = document.querySelector("#run");
  button.disabled = true;

  const out = document.querySelector("#out");
  out.classList.add("refreshing");

  try {
    if (!SYSTEMS.new.World) {
      status("loading the systems…");
      await load_systems();
    }

    //everything, for each system:
    const R = {};
    for (const s of SYSTEM_LIST) {
      sys = s;
      status(`${s.name} system: sampling the math…`);
      await next_tick();
      const rows = sample_by_age(c, c.per_age);
      const lives = survival(c, 3000);
      const spacing = sys.spacing();

      const sim = await simulate(c, (d) => status(`${s.name} system: simulating… day ${d} of ${c.days}`));

      status(`${s.name} system: checking many cases…`);
      await next_tick();
      const cases = [];
      for (const k of CASES) {
        cases.push(summarise_case(k, 40));
        await next_tick();
      }
      R[s.name] = { rows, survival: lives, spacing, sim, cases };
    }

    out.replaceChildren();
    render_math(out, c, R);
    render_relationships(out, R);
    render_simulation(out, c, R);
    render_checks(out, c, R);
    render_cases(out, R);
    status(`done: ${c.w}×${c.h}, ${c.pop} beings, ${c.day}-second days, max mass ${c.mm}; ${c.days} days simulated, in each system.`);
  } catch (e) {
    status("something went wrong: " + e.message);
    throw e;
  } finally {
    out.classList.remove("refreshing");
    button.disabled = false;
  }
}

function section(out, title, note) {
  const s = make("div", { class: "section" }, out);
  text_node("h2", title, {}, s);
  if (note) text_node("p", note, { class: "note" }, s);
  return make("div", { class: "grid-cards" }, s);
}

//one series per system (named, coloured & dashed as the system), from that system's results.
function per_system(R, points_of, extra = {}) {
  return SYSTEM_LIST.map((s) => ({ name: s.name, color: s.color, dashed: s.dashed, ...extra, points: points_of(R[s.name]) }));
}

function render_math(out, c, R) {
  const g = section(out, "1. the math", `${c.per_age} beings sampled at every age, in each system, each at a random place; lines are medians, bands are 25–75% and 5–95%.`);

  band_chart(g, {
    title: "energy by age",
    subtitle: "new: rises through childhood, peaks in the 20s & 30s, declines from middle age, keeps a fifth; vigor spreads it. old: a narrow window, from about 14 to 45.",
    series: per_system(R, (r) => band(r.rows, "age", "energy", AGES)),
    x_label: "age",
    y_label: "energy",
    y_format: (v) => v.toFixed(1),
  });

  band_chart(g, {
    title: "speed by age",
    subtitle: `new: follows energy (& personal pace), in the world's own geography. old: energy / mass. pixels per frame, in this world (places ~${Math.round(R.new.spacing)}px apart).`,
    series: per_system(R, (r) => band(r.rows, "age", "speed", AGES.filter((a) => a > 1))),
    x_label: "age",
    y_label: "px / frame",
    y_format: (v) => v.toFixed(2),
  });

  band_chart(g, {
    title: "places wished for, by age",
    subtitle: "average places a being wishes to be at in a day. both: the same draw, of 2 to 12 (new: in any day length, since a day is always 24 hours; old: in any day length, whether it fits or not). (whole numbers, so averages.)",
    bands: false,
    series: per_system(R, (r) => mean_by(r.rows, "age", "busyness", AGES)),
    x_label: "age",
    y_label: "places / day",
    y_format: (v) => v.toFixed(1),
  });

  band_chart(g, {
    title: "places planned, by age",
    subtitle: "new: the places its day & body allow. old: the slots of its schedule that get an hour; in short days, many don't.",
    bands: false,
    series: per_system(R, (r) => mean_by(r.rows, "age", "planned", AGES.filter((a) => a > 1))),
    x_label: "age",
    y_label: "places / day",
    y_format: (v) => v.toFixed(1),
  });

  band_chart(g, {
    title: "probability of dying, per roll",
    subtitle: "a day is a year. new: rolled once a day; frailty (1 / vigor) spreads it. old: the same curve, no vigor; but rolled on every frame of the killing hour, until the world is down to 95%.",
    series: per_system(R, (r) => band(r.rows, "age", "death", AGES)),
    x_label: "age",
    y_label: "per roll",
    y_format: (v) => pct(v, v < 0.01 ? 2 : 0),
  });

  band_chart(g, {
    title: "share still alive",
    subtitle: "lifespans from the death math, for 3000 beings; new split into thirds by vigor. old as if rolled once a day, which it isn't (see age at death, below).",
    bands: false,
    y_domain: [0, 1],
    series: [
      { name: "new, low vigor", color: "--ord-1", points: R.new.survival.low.map((s, i) => ({ x: i, p50: s })) },
      { name: "new, middle", color: "--ord-2", points: R.new.survival.middle.map((s, i) => ({ x: i, p50: s })) },
      { name: "new, high vigor", color: "--ord-3", points: R.new.survival.high.map((s, i) => ({ x: i, p50: s })) },
      { name: "old", color: SYSTEMS.old.color, dashed: true, points: R.old.survival.all.map((s, i) => ({ x: i, p50: s })) },
    ],
    x_label: "age",
    y_label: "alive",
    y_format: (v) => pct(v, 0),
  });
}

function render_relationships(out, R) {
  const g = section(out, "relationships & odds", "how the quantities move together, and how likely the unlikely is.");

  for (const s of SYSTEM_LIST) {
    const groups = [
      { name: "under 18", color: "--series-1", lo: 2, hi: 17 },
      { name: "18–45", color: "--series-2", lo: 18, hi: 45 },
      { name: "over 45", color: "--series-3", lo: 46, hi: 100 },
    ].map((grp) => ({
      ...grp,
      points: R[s.name].rows
        .filter((r) => r.age >= grp.lo && r.age <= grp.hi && Math.random() < 0.25)
        .map((r) => ({
          x: r.energy,
          y: r.planned + (Math.random() - 0.5) * 0.5, //jittered, so stacked dots show.
          raw_y: r.planned,
          label: `age ${r.age} · energy ${r.energy.toFixed(1)} · plans ${r.planned} of ${r.busyness} wished`,
        })),
    }));

    scatter_chart(g, {
      title: `${s.name}: energy vs places planned`,
      subtitle: s.name === "new" ? "more energy, more places reachable in a day. dots are jittered up/down." : "old plans don't depend on energy. dots are jittered up/down.",
      groups,
      x_label: "energy",
      y_label: "places / day",
      x_format: (v) => v.toFixed(1),
      y_format: (v) => v.toFixed(0),
    });
  }

  const odds = (r) => {
    const of = (lo, hi, key) => r.rows.filter((row) => row.age >= lo && row.age <= hi && row[key] !== null).map((row) => row[key]);
    const median_25 = (key) => median(of(23, 27, key));
    const share_above = (values, line) => values.filter((v) => v > line).length / values.length;
    const lives = r.survival;

    return [
      pct(chance_greater(of(58, 62, "busyness"), of(21, 25, "busyness"))),
      pct(chance_greater(of(58, 62, "planned"), of(21, 25, "planned"))),
      pct(share_above(of(58, 62, "energy"), median_25("energy"))),
      pct(share_above(of(43, 47, "speed"), median_25("speed"))),
      pct(share_above(of(8, 12, "planned"), median_25("planned"))),
      pct(lives.all[90]),
      pct(1 - lives.all[50]),
      lives.low ? `${median_lifespan(lives.low)} / ${median_lifespan(lives.middle)} / ${median_lifespan(lives.high)}` : `${median_lifespan(lives.all)} (no vigor)`,
    ];
  };
  const values = SYSTEM_LIST.map((s) => odds(R[s.name]));
  const labels = [
    "a ~60-year-old wishes to be busier than a ~23-year-old",
    "a ~60-year-old plans more places than a ~23-year-old",
    "a ~60-year-old has more energy than a typical 25-year-old",
    "a ~45-year-old is faster than a typical 25-year-old",
    "a child (8–12) plans more places than a typical 25-year-old",
    "living past 90 (death math, once a day)",
    "dying before 50 (death math, once a day)",
    "median lifespan: low / middle / high vigor",
  ];

  odds_table(
    g,
    "how likely is the unlikely?",
    "counted over the sampled beings.",
    labels.map((label, i) => [label, ...values.map((v) => v[i])]),
    SYSTEM_LIST.map((s) => s.name),
  );
}

function render_simulation(out, c, R) {
  const g = section(out, "2. the simulation", `a world of ${c.pop} beings in each system, run for ${c.days} days (the first 3 are left out of the age charts, while beings settle).`);

  band_chart(g, {
    title: "population",
    subtitle: "beings die & are born; the world keeps itself near its size.",
    bands: false,
    y_domain: [0, Math.ceil((c.pop * 1.2) / 10) * 10],
    series: per_system(R, (r) => r.sim.population),
    x_label: "day",
    y_label: "beings",
    y_format: (v) => v.toFixed(0),
    table_step: 5,
  });

  const bins = Array.from({ length: 17 }, (_, i) => i * 5);
  band_chart(g, {
    title: "places reached per day, as lived",
    subtitle: "averages from living beings, every day (by 5-year age groups). a place counts when a being gets to where it was heading.",
    bands: false,
    series: per_system(R, (r) => mean_by(r.sim.lives, "age_bin", "reached", bins)),
    x_label: "age",
    y_label: "places / day",
    y_format: (v) => v.toFixed(1),
  });

  band_chart(g, {
    title: "beings on the move, over the last 2 days",
    subtitle: "share of beings (2+) travelling at each moment. a steady line means free-flowing movement; spikes mean everyone moves at once.",
    bands: false,
    y_domain: [0, 1],
    series: per_system(R, (r) => r.sim.moving),
    x_label: "hour",
    y_label: "travelling",
    y_format: (v) => pct(v, 0),
    table_step: 6,
  });

  band_chart(g, {
    title: "share of the day spent travelling",
    subtitle: "the rest is staying. (old: a being counts as travelling until it's within its mass of where it's heading; a slow being is travelling, however slowly.)",
    series: per_system(R, (r) => band(r.sim.lives, "age_bin", "travelling", bins)),
    x_label: "age",
    y_label: "of the day",
    y_format: (v) => pct(v, 0),
  });

  //age at death: simulated vs what the math expects (deaths at each age = drop in the share alive).
  const deaths_sim = (r) => {
    const total = r.sim.deaths.length || 1;
    return bins.map((b) => ({ x: b, p50: r.sim.deaths.filter((d) => d.age >= b && d.age < b + 5).length / total }));
  };
  const lives = R.new.survival.all;
  band_chart(g, {
    title: "age at death",
    subtitle: `${R.new.sim.deaths.length} deaths in the new simulation, ${R.old.sim.deaths.length} in the old one; the new one against its math. (the old one has no math line: it doesn't roll once a day. short runs are noisy; the starting ages also shape it.)`,
    bands: false,
    series: [
      { name: "new", color: SYSTEMS.new.color, points: deaths_sim(R.new) },
      { name: "new, math", color: "--series-3", points: bins.map((b) => ({ x: b, p50: (lives[b] ?? 0) - (lives[Math.min(100, b + 5)] ?? 0) })) },
      { name: "old", color: SYSTEMS.old.color, dashed: true, points: deaths_sim(R.old) },
    ],
    x_label: "age",
    y_label: "share of deaths",
    y_format: (v) => pct(v, 0),
  });
}

/*
what a system should do, measured. each check returns { value, pass }; pass is null when it doesn't apply to the system.
*/
const CHECKS = [
  {
    name: "energy peaks in young adulthood",
    expect: "peak age 18–35",
    measure: (r) => {
      const age = peak_age(r.rows, "energy");
      return { value: "peak at " + age, pass: age >= 18 && age <= 35 };
    },
  },
  {
    //speed vs energy: how well a straight line through zero explains it.
    name: "speed follows energy",
    expect: "speed ∝ energy (± personal pace)",
    measure: (r) => {
      const q = quantiles(r.rows.filter((row) => row.age >= 2 && row.energy > 0.01).map((row) => row.speed / row.energy));
      return { value: `speed/energy: ${q.p5.toFixed(3)}–${q.p95.toFixed(3)} (5–95%)`, pass: q.p95 / q.p5 < 1.8 };
    },
  },
  {
    name: "speed doesn't depend on max mass",
    expect: "< 10% apart for max mass 4 / 10 / 30",
    measure: (r) => {
      const speeds = r.cases.filter((k) => k.c.w === 1000 && k.c.pop === 300 && k.c.day === 10).map((k) => k.speed_25);
      const gap = (Math.max(...speeds) - Math.min(...speeds)) / Math.max(...speeds);
      return { value: pct(gap), pass: gap < 0.1 };
    },
  },
  {
    name: "busyness wish peaks in the 20s",
    expect: "peak age 20–30",
    measure: (r) => {
      const age = peak_age(r.rows, "busyness");
      return { value: "peak at " + age, pass: age >= 20 && age <= 30 };
    },
  },
  {
    name: "young adults plan the most places",
    expect: "18–35 > 36–59 ≥ 60+",
    measure: (r) => {
      const [a, b, c] = [group_median(r.rows, 18, 35, "planned"), group_median(r.rows, 36, 59, "planned"), group_median(r.rows, 60, 100, "planned")];
      return { value: `${a} / ${b} / ${c}`, pass: a > b && b >= c };
    },
  },
  {
    name: "an old being busier than a young one: possible, not likely",
    expect: "between 0% and 10%",
    measure: (r) => {
      const of = (lo, hi) => r.rows.filter((row) => row.age >= lo && row.age <= hi).map((row) => row.busyness);
      const chance = chance_greater(of(58, 62), of(21, 25));
      return { value: pct(chance), pass: chance > 0 && chance < 0.1 };
    },
  },
  {
    name: "vigorous beings live longer",
    expect: "median lifespan: high > low vigor",
    measure: (r) => {
      if (!r.survival.low) return { value: "no vigor", pass: null };
      const [high, low] = [median_lifespan(r.survival.high), median_lifespan(r.survival.low)];
      return { value: `${high} vs ${low}`, pass: Number(high) > Number(low) };
    },
  },
  {
    name: "death is near-certain by 100",
    expect: "< 10% alive at 100 (death math, once a day)",
    measure: (r) => ({ value: pct(r.survival.all[100]), pass: r.survival.all[100] < 0.1 }),
  },
  {
    name: "population stays steady",
    expect: "never below 90% of its size",
    measure: (r, c) => {
      const pops = r.sim.population.map((p) => p.p50);
      return { value: `${Math.min(...pops)}–${Math.max(...pops)} of ${c.pop}`, pass: Math.min(...pops) >= 0.9 * c.pop };
    },
  },
  {
    name: "a pair has one child per round",
    expect: "no being a parent twice in a round",
    measure: (r) => {
      if (r.sim.most_children_per_round === null) return { value: "no rounds", pass: null };
      return { value: "most per round: " + r.sim.most_children_per_round, pass: r.sim.most_children_per_round <= 1 };
    },
  },
  {
    name: "young adults get out",
    expect: "< 10% of 18–45s reach no place all day",
    measure: (r) => {
      const young = r.sim.lives.filter((l) => l.age >= 18 && l.age <= 45);
      const share = young.filter((l) => l.nowhere).length / (young.length || 1);
      return { value: pct(share), pass: share < 0.1 };
    },
  },
  {
    //departures bunching: the share of departures in the busiest 1% of the day's frames (even spread: ~1%).
    name: "departures don't bunch up",
    expect: "< 5% of departures in the busiest 1% of moments",
    measure: (r) => {
      const all = r.sim.departures.reduce((a, b) => a + b, 0) || 1;
      const busiest = [...r.sim.departures].sort((a, b) => b - a).slice(0, Math.ceil(r.sim.departures.length / 100));
      const bunching = busiest.reduce((a, b) => a + b, 0) / all;
      return { value: pct(bunching), pass: bunching < 0.05 };
    },
  },
  {
    name: "movement flows steadily",
    expect: "share travelling stays within ±10 points (5–95%)",
    measure: (r) => {
      const q = quantiles(r.sim.moving.map((m) => m.p50));
      return { value: `${pct(q.p5, 0)}–${pct(q.p95, 0)} (median ${pct(q.p50, 0)})`, pass: q.p95 - q.p5 < 0.2 };
    },
  },
];

//the age with the highest mean (medians of whole numbers tie, e.g. busyness in short days):
function peak_age(rows, key) {
  let best = null;
  for (const age of AGES.filter((a) => a > 1)) {
    const values = rows.filter((r) => r.age === age).map((r) => r[key]);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    if (!best || mean > best.mean) best = { age, mean };
  }
  return best.age;
}

function group_median(rows, lo, hi, key) {
  return median(rows.filter((r) => r.age >= lo && r.age <= hi && r[key] !== null).map((r) => r[key]));
}

function render_checks(out, c, R) {
  const g = section(out, "checks", "what the system should do, measured in each.");

  checks_table(
    g,
    "this world",
    `${c.w}×${c.h}, ${c.pop} beings, ${c.day}-second days, max mass ${c.mm}.`,
    SYSTEM_LIST.map((s) => s.name),
    CHECKS.map((check) => ({ ...check, results: SYSTEM_LIST.map((s) => check.measure(R[s.name], c)) })),
  );
}

function render_cases(out, R) {
  const g = section(out, "3. many cases", "40 beings sampled at every age, in each world & system. 'one place all day' means the being's routine has only one place in it.");

  const { body } = chart_card(g, "across worlds", "speeds are in this world's pixels; the same in every world relative to its places (in the new system).");
  const table = make("table", { class: "data" }, body);
  const head = make("tr", {}, make("thead", {}, table));
  for (const h of ["world", "beings", "day", "max mass", "system", "places apart", "speed at 25", "wish / plan at 25", "one place all day: 18–35 / 36–59 / 60+", "60 plans more than 23"]) {
    text_node("th", h, {}, head);
  }
  const tb = make("tbody", {}, table);
  CASES.forEach((world_case, i) => {
    for (const s of SYSTEM_LIST) {
      const k = R[s.name].cases[i];
      const tr = make("tr", { class: s.name === SYSTEM_LIST[0].name ? "case-first" : "" }, tb);
      for (const v of [
        `${k.c.w}×${k.c.h}`,
        String(k.c.pop),
        k.c.day + "s",
        String(k.c.mm),
        s.name,
        Math.round(k.spacing) + "px",
        k.speed_25.toFixed(2) + " px/f",
        `${k.wish_25} / ${k.planned_25}`,
        `${pct(k.one_young, 0)} / ${pct(k.one_middle, 0)} / ${pct(k.one_old, 0)}`,
        pct(k.old_busier),
      ]) {
        text_node("td", v, {}, tr);
      }
    }
  });
}
