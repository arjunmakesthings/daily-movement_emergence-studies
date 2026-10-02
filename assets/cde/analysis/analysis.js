/*
analysis of the base simulation.

it uses the real system (./main/system/world.js & being.js), in three ways:
1. the math: make many beings at every age, and graph what the system gives them (energy, speed, busyness, chance of death, lifespan).
2. the simulation: run a world for some days, and graph what actually happens.
3. many cases: repeat the main checks across many worlds (sizes, populations, day-lengths, max-masses).

noise is intended: so, everything is shown as a spread (median, 25–75%, 5–95%), and the odds of unlikely things are counted, not hidden.
*/

let world; //the system reads this global.

const AGES = Array.from({ length: 101 }, (_, i) => i);

function setup() {
  createCanvas(1, 1).hide(); //the system needs p5 running; nothing is drawn.
  noLoop();

  document.querySelector("#run").addEventListener("click", run);
  run();
}

/*
----------------------------------------
helpers:
----------------------------------------
*/

//the system reads p5's frameCount; we drive it ourselves.
function set_frame(f) {
  window.frameCount = f;
}

function make_world(c) {
  set_frame(0);
  world = new World(c.w, c.h, c.pop, c.day, c.mm);
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
make many beings at each age (at home, at a random place), and record what the system gives each of them.
*/
function sample_by_age(c, per_age) {
  make_world(c);
  const rows = [];

  for (const age of AGES) {
    for (let k = 0; k < per_age; k++) {
      const home = random(world.places);
      const b = new Being(home.pos.x, home.pos.y, age);

      rows.push({
        age,
        energy: b.energy,
        speed: b.get_speed(),
        busyness: b.busyness,
        planned: age > 1 ? b.destinations.length : null, //beings under 2 don't move.
        vigor: b.maxes.vigor,
        death: b.get_death_chance(),
      });
    }
  }
  return rows;
}

/*
lifetimes from the death math: a being is alive at an age if it survived every day (a day is a year) before it.
returns, per vigor third (low, middle, high), the share alive at each age.
*/
function survival_by_vigor(c, n) {
  make_world(c);
  const lives = [];

  for (let k = 0; k < n; k++) {
    const b = new Being(c.w / 2, c.h / 2, 0);
    const alive = [];
    let s = 1;
    for (const age of AGES) {
      alive.push(s);
      b.age = age;
      s *= 1 - Math.min(1, b.get_death_chance());
    }
    lives.push({ vigor: b.maxes.vigor, alive });
  }

  lives.sort((a, b) => a.vigor - b.vigor);
  const third = Math.floor(n / 3);
  const groups = [lives.slice(0, third), lives.slice(third, 2 * third), lives.slice(2 * third)];

  const curve = (group) => AGES.map((age, i) => group.reduce((sum, l) => sum + l.alive[i], 0) / group.length);
  return {
    all: curve(lives),
    low: curve(groups[0]),
    middle: curve(groups[1]),
    high: curve(groups[2]),
  };
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

  const day_frames = world.hour_length * c.day;
  const warm_up = 3; //days: beings start at random spots; let them settle into their days.

  const out = {
    population: [],
    lives: [],
    deaths: [],
    most_children_per_round: 0,
    moving: [], //share of beings travelling, over the last 2 days.
    departures: new Array(day_frames).fill(0), //departures, by frame of the day.
  };
  const travelling = new Map(); //being -> frames spent travelling today.
  const was_travelling = new Map(); //being -> travelling last frame?

  //watch reproduction: in one round, no being should be a parent twice.
  const proto = Being.prototype;
  const reproduce = proto.reproduce;
  let parents_this_frame = new Map();
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

  try {
    for (let day = 0; day < c.days; day++) {
      for (let f = 1; f <= day_frames; f++) {
        set_frame(day * day_frames + f);
        parents_this_frame = new Map();

        const before = world.beings.slice();
        world.run();

        //who died (deaths only happen on the hour):
        if (world.new_hour && day >= warm_up) {
          const now = new Set(world.beings);
          for (const b of before) {
            if (!now.has(b)) out.deaths.push({ age: b.age, vigor: b.maxes.vigor });
          }
        }

        let moving = 0;
        let able = 0; //beings old enough to move.
        for (const b of world.beings) {
          const now = b.state === "travelling";
          if (now) travelling.set(b, (travelling.get(b) || 0) + 1);
          if (now && was_travelling.get(b) === false && day >= warm_up) out.departures[f - 1]++;
          was_travelling.set(b, now);

          if (b.age > 1) {
            able++;
            if (now) moving++;
          }
        }
        if (day >= c.days - 2 && f % 5 === 0) {
          out.moving.push({ x: +((day - (c.days - 2)) * c.day + f / world.hour_length).toFixed(2), p50: moving / able });
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
            busyness: b.busyness,
            planned: b.destinations.length,
            home_only: b.destinations.length === 1,
            travelling: (travelling.get(b) || 0) / day_frames,
          });
        }
      }
      travelling.clear();

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
  const home_only = (rs) => rs.filter((r) => r.planned === 1).length / rs.length;

  return {
    c,
    speed_25: median(of(23, 27).map((r) => r.speed)),
    spacing: world.place_spacing,
    wish_25: median(of(23, 27).map((r) => r.busyness)),
    planned_25: median(of(23, 27).map((r) => r.planned)),
    home_young: home_only(of(18, 35)),
    home_middle: home_only(of(36, 59)),
    home_old: home_only(of(60, 100)),
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
    status("sampling the math…");
    await next_tick();
    const rows = sample_by_age(c, c.per_age);
    const survival = survival_by_vigor(c, 3000);

    status("simulating…");
    const sim = await simulate(c, (d) => status(`simulating… day ${d} of ${c.days}`));

    status("checking many cases…");
    await next_tick();
    const cases = [];
    for (const k of CASES) {
      cases.push(summarise_case(k, 40));
      await next_tick();
    }

    out.replaceChildren();
    render_math(out, c, rows, survival);
    render_relationships(out, rows, survival);
    render_simulation(out, c, sim, survival);
    render_checks(out, c, rows, survival, sim, cases);
    render_cases(out, cases);
    status(`done: ${c.w}×${c.h}, ${c.pop} beings, ${c.day}-hour days, max mass ${c.mm}; ${c.days} days simulated.`);
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

function render_math(out, c, rows, survival) {
  const g = section(out, "1. the math", `${c.per_age} beings sampled at every age, each at home; lines are medians, bands are 25–75% and 5–95%.`);

  band_chart(g, {
    title: "energy by age",
    subtitle: "rises through childhood, peaks in the 20s & 30s, declines from middle age; vigor spreads it.",
    series: [{ name: "energy", color: "--series-1", points: band(rows, "age", "energy", AGES) }],
    x_label: "age",
    y_label: "energy",
    y_format: (v) => v.toFixed(1),
  });

  band_chart(g, {
    title: "speed by age",
    subtitle: `follows energy (and personal pace). pixels per frame, in this world (places ~${Math.round(world.place_spacing)}px apart).`,
    series: [{ name: "speed", color: "--series-1", points: band(rows, "age", "speed", AGES) }],
    x_label: "age",
    y_label: "px / frame",
    y_format: (v) => v.toFixed(2),
  });

  band_chart(g, {
    title: "busyness by age",
    subtitle: "average places a being wishes to be at in a day (incl. home), and how many its day & body allow. (whole numbers, so averages; the odds below show the spread.)",
    bands: false,
    series: [
      { name: "wished", color: "--series-1", points: mean_by(rows, "age", "busyness", AGES) },
      { name: "planned", color: "--series-2", points: mean_by(rows, "age", "planned", AGES.filter((a) => a > 1)) },
    ],
    x_label: "age",
    y_label: "places / day",
    y_format: (v) => v.toFixed(1),
  });

  band_chart(g, {
    title: "chance of dying, per day",
    subtitle: "a day is a year. rises steeply with age; frailty (1 / vigor) spreads it.",
    series: [{ name: "chance", color: "--series-1", points: band(rows, "age", "death", AGES) }],
    x_label: "age",
    y_label: "per day",
    y_format: (v) => pct(v, v < 0.01 ? 2 : 0),
  });

  band_chart(g, {
    title: "share still alive, by vigor",
    subtitle: "lifespans from the death math, for 3000 beings split into thirds by vigor.",
    bands: false,
    y_domain: [0, 1],
    series: [
      { name: "low vigor", color: "--ord-1", points: survival.low.map((s, i) => ({ x: i, p50: s })) },
      { name: "middle", color: "--ord-2", points: survival.middle.map((s, i) => ({ x: i, p50: s })) },
      { name: "high vigor", color: "--ord-3", points: survival.high.map((s, i) => ({ x: i, p50: s })) },
    ],
    x_label: "age",
    y_label: "alive",
    y_format: (v) => pct(v, 0),
  });
}

function render_relationships(out, rows, survival) {
  const g = section(out, "relationships & odds", "how the quantities move together, and how likely the unlikely is.");

  const groups = [
    { name: "under 18", color: "--series-1", lo: 2, hi: 17 },
    { name: "18–45", color: "--series-2", lo: 18, hi: 45 },
    { name: "over 45", color: "--series-3", lo: 46, hi: 100 },
  ].map((grp) => ({
    ...grp,
    points: rows
      .filter((r) => r.age >= grp.lo && r.age <= grp.hi && Math.random() < 0.25)
      .map((r) => ({
        x: r.energy,
        y: r.planned + (Math.random() - 0.5) * 0.5, //jittered, so stacked dots show.
        raw_y: r.planned,
        label: `age ${r.age} · energy ${r.energy.toFixed(1)} · plans ${r.planned} of ${r.busyness} wished`,
      })),
  }));

  scatter_chart(g, {
    title: "energy vs places planned",
    subtitle: "more energy, more places reachable in a day. dots are jittered up/down.",
    groups,
    x_label: "energy",
    y_label: "places / day",
    x_format: (v) => v.toFixed(1),
    y_format: (v) => v.toFixed(0),
  });

  const of = (lo, hi, key) => rows.filter((r) => r.age >= lo && r.age <= hi && r[key] !== null).map((r) => r[key]);
  const median_25 = (key) => median(of(23, 27, key));
  const share_above = (values, line) => values.filter((v) => v > line).length / values.length;

  odds_table(g, "how likely is the unlikely?", "counted over the sampled beings.", [
    ["a ~60-year-old wishes to be busier than a ~23-year-old", pct(chance_greater(of(58, 62, "busyness"), of(21, 25, "busyness")))],
    ["a ~60-year-old plans more places than a ~23-year-old", pct(chance_greater(of(58, 62, "planned"), of(21, 25, "planned")))],
    ["a ~60-year-old has more energy than a typical 25-year-old", pct(share_above(of(58, 62, "energy"), median_25("energy")))],
    ["a ~45-year-old is faster than a typical 25-year-old", pct(share_above(of(43, 47, "speed"), median_25("speed")))],
    ["a child (8–12) plans more places than a typical 25-year-old", pct(share_above(of(8, 12, "planned"), median_25("planned")))],
    ["living past 90", pct(survival.all[90])],
    ["dying before 50", pct(1 - survival.all[50])],
    ["median lifespan: low / middle / high vigor", `${median_lifespan(survival.low)} / ${median_lifespan(survival.middle)} / ${median_lifespan(survival.high)}`],
  ]);
}

function render_simulation(out, c, sim, survival) {
  const g = section(out, "2. the simulation", `a world of ${c.pop} beings, run for ${c.days} days (the first 3 are left out of the age charts, while beings settle).`);

  band_chart(g, {
    title: "population",
    subtitle: "beings die & are born; the world keeps itself near its size.",
    bands: false,
    y_domain: [0, Math.ceil((c.pop * 1.2) / 10) * 10],
    series: [{ name: "beings", color: "--series-1", points: sim.population }],
    x_label: "day",
    y_label: "beings",
    y_format: (v) => v.toFixed(0),
    table_step: 5,
  });

  const bins = Array.from({ length: 17 }, (_, i) => i * 5);
  band_chart(g, {
    title: "places per day, as lived",
    subtitle: "averages from living beings, every day (by 5-year age groups).",
    bands: false,
    series: [
      { name: "wished", color: "--series-1", points: mean_by(sim.lives, "age_bin", "busyness", bins) },
      { name: "planned", color: "--series-2", points: mean_by(sim.lives, "age_bin", "planned", bins) },
    ],
    x_label: "age",
    y_label: "places / day",
    y_format: (v) => v.toFixed(1),
  });

  band_chart(g, {
    title: "beings on the move, over the last 2 days",
    subtitle: "share of beings (2+) travelling at each moment. a steady line means free-flowing movement; spikes mean everyone moves at once.",
    bands: false,
    y_domain: [0, 1],
    series: [{ name: "travelling", color: "--series-1", points: sim.moving }],
    x_label: "hour",
    y_label: "travelling",
    y_format: (v) => pct(v, 0),
    table_step: c.day,
  });

  band_chart(g, {
    title: "share of the day spent travelling",
    subtitle: "the rest is staying (at home, or elsewhere).",
    series: [{ name: "travelling", color: "--series-1", points: band(sim.lives, "age_bin", "travelling", bins) }],
    x_label: "age",
    y_label: "of the day",
    y_format: (v) => pct(v, 0),
  });

  //age at death: simulated vs what the math expects (deaths at each age = drop in the share alive).
  const deaths_math = bins.map((b) => ({ x: b, p50: (survival.all[b] ?? 0) - (survival.all[Math.min(100, b + 5)] ?? 0) }));
  const total = sim.deaths.length || 1;
  const deaths_sim = bins.map((b) => ({ x: b, p50: sim.deaths.filter((d) => d.age >= b && d.age < b + 5).length / total }));
  band_chart(g, {
    title: "age at death",
    subtitle: `${sim.deaths.length} deaths in the simulation, against the math's lifespans. (short runs are noisy; the starting ages also shape it.)`,
    bands: false,
    series: [
      { name: "simulated", color: "--series-1", points: deaths_sim },
      { name: "math", color: "--series-2", points: deaths_math },
    ],
    x_label: "age",
    y_label: "share of deaths",
    y_format: (v) => pct(v, 0),
  });
}

function render_checks(out, c, rows, survival, sim, cases) {
  const g = section(out, "checks", "what the system should do, measured.");

  //the age with the highest mean (medians of whole numbers tie, e.g. busyness in short days):
  const peak_age = (key) => {
    let best = null;
    for (const age of AGES.filter((a) => a > 1)) {
      const values = rows.filter((r) => r.age === age).map((r) => r[key]);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      if (!best || mean > best.mean) best = { age, mean };
    }
    return best.age;
  };
  const group_median = (lo, hi, key) => median(rows.filter((r) => r.age >= lo && r.age <= hi && r[key] !== null).map((r) => r[key]));

  //speed vs energy: how well a straight line through zero explains it.
  const adults = rows.filter((r) => r.age >= 2);
  const ratio = adults.map((r) => r.speed / r.energy);
  const ratio_spread = quantiles(ratio);

  const old_busier = chance_greater(
    rows.filter((r) => r.age >= 58 && r.age <= 62).map((r) => r.busyness),
    rows.filter((r) => r.age >= 21 && r.age <= 25).map((r) => r.busyness),
  );

  const same_but_mass = cases.filter((k) => k.c.w === 1000 && k.c.pop === 300 && k.c.day === 10);
  const speeds = same_but_mass.map((k) => k.speed_25);
  const speed_gap = (Math.max(...speeds) - Math.min(...speeds)) / Math.max(...speeds);

  const pops = sim.population.map((p) => p.p50);

  //departures bunching: the share of departures in the busiest 1% of the day's frames (even spread: ~1%).
  const all_departures = sim.departures.reduce((a, b) => a + b, 0) || 1;
  const busiest = [...sim.departures].sort((a, b) => b - a).slice(0, Math.ceil(sim.departures.length / 100));
  const bunching = busiest.reduce((a, b) => a + b, 0) / all_departures;
  const moving = quantiles(sim.moving.map((m) => m.p50));
  const lived_young = sim.lives.filter((l) => l.age >= 18 && l.age <= 45);
  const camping_young = lived_young.filter((l) => l.home_only).length / (lived_young.length || 1);

  const rows_out = [
    { name: "energy peaks in young adulthood", expect: "peak age 18–35", value: "peak at " + peak_age("energy"), pass: peak_age("energy") >= 18 && peak_age("energy") <= 35 },
    { name: "speed follows energy", expect: "speed ∝ energy (± personal pace)", value: `speed/energy: ${ratio_spread.p5.toFixed(3)}–${ratio_spread.p95.toFixed(3)} (5–95%)`, pass: ratio_spread.p95 / ratio_spread.p5 < 1.8 },
    { name: "speed doesn't depend on max mass", expect: "< 10% apart for max mass 4 / 10 / 30", value: pct(speed_gap), pass: speed_gap < 0.1 },
    { name: "busyness wish peaks in the 20s", expect: "peak age 20–30", value: "peak at " + peak_age("busyness"), pass: peak_age("busyness") >= 20 && peak_age("busyness") <= 30 },
    {
      name: "young adults plan the most places",
      expect: "18–35 > 36–59 ≥ 60+",
      value: `${group_median(18, 35, "planned")} / ${group_median(36, 59, "planned")} / ${group_median(60, 100, "planned")}`,
      pass: group_median(18, 35, "planned") > group_median(36, 59, "planned") && group_median(36, 59, "planned") >= group_median(60, 100, "planned"),
    },
    { name: "an old being busier than a young one: possible, not likely", expect: "between 0% and 10%", value: pct(old_busier), pass: old_busier > 0 && old_busier < 0.1 },
    { name: "vigorous beings live longer", expect: "median lifespan: high > low vigor", value: `${median_lifespan(survival.high)} vs ${median_lifespan(survival.low)}`, pass: Number(median_lifespan(survival.high)) > Number(median_lifespan(survival.low)) },
    { name: "death is near-certain by 100", expect: "< 10% alive at 100", value: pct(survival.all[100]), pass: survival.all[100] < 0.1 },
    { name: "population stays steady", expect: "never below 90% of its size", value: `${Math.min(...pops)}–${Math.max(...pops)} of ${c.pop}`, pass: Math.min(...pops) >= 0.9 * c.pop },
    { name: "a pair has one child per round", expect: "no being a parent twice in a round", value: "most per round: " + sim.most_children_per_round, pass: sim.most_children_per_round <= 1 },
    { name: "young adults get out", expect: "< 10% of 18–45s home all day", value: pct(camping_young), pass: camping_young < 0.1 },
    { name: "departures don't bunch up", expect: "< 5% of departures in the busiest 1% of moments", value: pct(bunching), pass: bunching < 0.05 },
    {
      name: "movement flows steadily",
      expect: "share travelling stays within ±10 points (5–95%)",
      value: `${pct(moving.p5, 0)}–${pct(moving.p95, 0)} (median ${pct(moving.p50, 0)})`,
      pass: moving.p95 - moving.p5 < 0.2,
    },
  ];

  checks_table(g, "this world", `${c.w}×${c.h}, ${c.pop} beings, ${c.day}-hour days, max mass ${c.mm}.`, rows_out);
}

function render_cases(out, cases) {
  const g = section(out, "3. many cases", "40 beings sampled at every age, in each world. 'home all day' means the being's day has no outing.");

  const { body } = chart_card(g, "across worlds", "speeds are in this world's pixels; the same in every world relative to its places.");
  const table = make("table", { class: "data" }, body);
  const head = make("tr", {}, make("thead", {}, table));
  for (const h of ["world", "beings", "day", "max mass", "places apart", "speed at 25", "wish / plan at 25", "home all day: 18–35 / 36–59 / 60+", "60 plans more than 23"]) {
    text_node("th", h, {}, head);
  }
  const tb = make("tbody", {}, table);
  for (const k of cases) {
    const tr = make("tr", {}, tb);
    for (const v of [
      `${k.c.w}×${k.c.h}`,
      String(k.c.pop),
      k.c.day + "h",
      String(k.c.mm),
      Math.round(k.spacing) + "px",
      k.speed_25.toFixed(2) + " px/f",
      `${k.wish_25} / ${k.planned_25}`,
      `${pct(k.home_young, 0)} / ${pct(k.home_middle, 0)} / ${pct(k.home_old, 0)}`,
      pct(k.old_busier),
    ]) {
      text_node("td", v, {}, tr);
    }
  }
}
