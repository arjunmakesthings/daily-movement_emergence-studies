/*
four graphs of the base simulation, for a slide:
1. busyness over age.
2. energy over age.
3. how much a being moves, over its day.
4. the population, with its births & deaths.

it uses the real system (./main/system/world.js & being.js), in the world below.
*/

//day is how many seconds a day lasts on screen (a day is always 24 hours); it doesn't change what beings do in a day, only how fast it plays.
const CONFIG = { w: 1440, h: 900, pop: 500, day: 24, mm: 10, days: 20, per_age: 200 };

const AGES = Array.from({ length: 101 }, (_, i) => i);
const WARM_UP = 3; //days: beings start at random spots; let them settle into their days.

let world; //the system reads this global.

function setup() {
  createCanvas(1, 1).hide(); //the system needs p5 running; nothing is drawn.
  noLoop();
  make_slide();
}

async function make_slide() {
  const c = CONFIG;
  document.querySelector("#world").textContent = `a world of ${c.w}×${c.h}, with ${c.pop} beings, ${c.day}-second days & a max mass of ${c.mm}; ${c.per_age} beings sampled at every age, and a world run for ${c.days} days.`;

  const rows = sample_by_age();
  draw_busyness(rows);
  draw_energy(rows);
  draw_death(rows);

  const sim = await simulate((d) => status(`simulating… day ${d} of ${CONFIG.days}`));
  draw_movement(sim);
  draw_population(sim);
  status("");
}

/*
----------------------------------------
the system:
----------------------------------------
*/

//the system reads p5's frameCount; we drive it ourselves.
function set_frame(f) {
  window.frameCount = f;
}

function make_world() {
  set_frame(0);
  const c = CONFIG;
  world = new World(c.w, c.h, c.pop, c.day, c.mm);
}

/*
make many beings at each age (at a random place), and keep what the system gives them.
*/
function sample_by_age() {
  make_world();
  const rows = [];
  for (const age of AGES) {
    for (let k = 0; k < CONFIG.per_age; k++) {
      const place = random(world.places);
      const b = new Being(place.pos.x, place.pos.y, age);
      rows.push({ age, busyness: b.busyness, energy: b.energy, death: b.get_death_chance() });
    }
  }
  return rows;
}

/*
run a world, and keep: how far each being travels in each hour of its own day (from its day's start); and, every day, the population (at its end, & its lowest & highest), births & deaths.
*/
async function simulate(on_day) {
  make_world();
  world.initialize();

  const day = world.day_hours;
  const day_frames = world.day_frames;

  const out = {
    days: [], //{ day, population, lowest, highest, births, deaths }
    hours: Array.from({ length: day }, () => []), //for each hour of a being's day: the pixels each being travelled in it, every day.
  };

  for (let d = 0; d < CONFIG.days; d++) {
    let births = 0;
    let deaths = 0;
    let lowest = Infinity;
    let highest = 0;

    //pixels travelled today, by hour of its own day; for the beings here (& able to move) as the day starts:
    const today = new Map(world.beings.filter((b) => b.age >= 1).map((b) => [b, new Array(day).fill(0)]));

    //the world's day d runs from frame d·day_frames (its new_day) to the frame before the next. (p5 starts at frame 1, so frame 0 never comes.)
    for (let f = d * day_frames; f < (d + 1) * day_frames; f++) {
      if (f === 0) continue;
      set_frame(f);

      //where everyone was, & whether they were on their way:
      const before = new Map(world.beings.map((b) => [b, { x: b.pos.x, y: b.pos.y, travelling: b.state === "travelling" }]));
      world.run();

      for (const b of world.beings) {
        const was = before.get(b);
        if (!was) {
          births++;
          continue;
        }
        before.delete(b);

        //only its own travel counts (not being nudged in a crowd), in the hour of its own day:
        const px = today.get(b);
        if (px && was.travelling) px[Math.floor((world.clock - b.day_start + day) % day)] += Math.hypot(b.pos.x - was.x, b.pos.y - was.y);
      }
      deaths += before.size; //whoever's left wasn't in the world after this frame.
      lowest = Math.min(lowest, world.beings.length);
      highest = Math.max(highest, world.beings.length);
    }

    //a whole day, for beings that lived all of it, aged 2 & over (birthdays come on the day's first frame; so, 1-year-olds turned 2 as it began):
    if (d >= WARM_UP) {
      const alive = new Set(world.beings);
      for (const [b, px] of today) {
        if (b.age < 2 || !alive.has(b)) continue;
        px.forEach((v, hour) => out.hours[hour].push(v));
      }
    }

    out.days.push({ day: d + 1, population: world.beings.length, lowest, highest, births, deaths });
    on_day(d + 1);
    await new Promise((resolve) => setTimeout(resolve));
  }
  return out;
}

/*
----------------------------------------
the graphs:
----------------------------------------
*/

function quantiles(values) {
  const s = [...values].sort((a, b) => a - b);
  const q = (p) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
  return { p5: q(0.05), p95: q(0.95) };
}

//per age: the mean, & the 5–95% spread.
function by_age(rows, key) {
  return AGES.map((age) => {
    const values = rows.filter((r) => r.age === age).map((r) => r[key]);
    return { x: age, y: values.reduce((a, b) => a + b, 0) / values.length, ...quantiles(values) };
  });
}

const AGE_TICKS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
const KEY = [
  { mark: "line", text: "average" },
  { mark: "band", text: "range (5–95% of beings)" },
];

function draw_busyness(rows) {
  const points = by_age(rows, "busyness");
  const top = headroom(Math.max(...points.map((p) => p.p95)));
  //places are whole numbers; so, a gridline every 2:
  const y_ticks = Array.from({ length: Math.floor(top / 2) + 1 }, (_, i) => i * 2);
  const plot = frame("#busyness svg", { x: [0, 100], y: [0, top], x_ticks: AGE_TICKS, y_ticks, x_label: "age", y_label: "places a day" });

  plot.band(points);
  plot.line(points);
  plot.key(KEY);
}

function draw_energy(rows) {
  const points = by_age(rows, "energy");
  const top = headroom(Math.max(...points.map((p) => p.p95)));
  const plot = frame("#energy svg", { x: [0, 100], y: [0, top], x_ticks: AGE_TICKS, y_ticks: nice_ticks(top), x_label: "age", y_label: "energy" });

  plot.band(points);
  plot.line(points);
  plot.key(KEY);
}

function draw_death(rows) {
  const points = by_age(rows, "death");
  const top = headroom(Math.max(...points.map((p) => p.p95)));
  const plot = frame("#death svg", {
    x: [0, 100],
    y: [0, top],
    x_ticks: AGE_TICKS,
    y_ticks: nice_ticks(top),
    y_format: (v) => +(v * 100).toFixed(1) + "%",
    x_label: "age",
    y_label: "probability of dying, per day",
  });

  plot.band(points);
  plot.line(points);
  plot.key(KEY);
}

function draw_movement(sim) {
  //per hour of a being's day: the mean pixels travelled in it, & their spread (over beings & days):
  const points = sim.hours.map((values, hour) => ({ x: hour + 0.5, y: values.reduce((a, b) => a + b, 0) / values.length, ...quantiles(values) }));
  const top = headroom(Math.max(...points.map((p) => p.p95)));
  const day = world.day_hours;
  const plot = frame("#movement svg", {
    x: [0, day],
    y: [0, top],
    x_ticks: Array.from({ length: Math.floor(day / 3) + 1 }, (_, i) => i * 3),
    y_ticks: nice_ticks(top),
    x_label: "hours into its day",
    y_label: "pixels an hour",
  });

  plot.band(points);
  plot.line(points);
  plot.key([KEY[0], { mark: "band", text: "range (5–95% of beings' hours)" }]);
  document.querySelector("#movement .measured").textContent = `places are ~${Math.round(world.place_spacing)}px apart.`;
}

function draw_population(sim) {
  const days = sim.days;
  const pop = CONFIG.pop;
  const svg = document.querySelector("#population svg");

  //above: the population; below: births (up) & deaths (down), each day.
  const plot = frame(svg, { x: [0.5, days.length + 0.5], y: [0, pop * 1.2], x_ticks: [], y_ticks: nice_ticks(pop * 1.2), x_label: "", y_label: "beings", box: { top: 24, bottom: 196 } });
  plot.band(
    days.map((d) => ({ x: d.day, lo: d.lowest, hi: d.highest })),
    "lo",
    "hi",
  );
  plot.line(days.map((d) => ({ x: d.day, y: d.population })));
  plot.key([
    { mark: "line", text: "at each day's end" },
    { mark: "band", text: "range (lowest–highest in the day)" },
  ]);

  const most = Math.max(1, ...days.map((d) => Math.max(d.births, d.deaths)));
  const strip = frame(svg, {
    x: [0.5, days.length + 0.5],
    y: [-most, most],
    x_ticks: [1, ...days.filter((d) => d.day % 5 === 0).map((d) => d.day)],
    y_ticks: [-most, 0, most],
    y_format: Math.abs,
    x_label: "day",
    y_label: "",
    box: { top: 288, bottom: 72 },
  });
  for (const d of days) {
    strip.bar(d.day, d.births, "bar");
    strip.bar(d.day, -d.deaths, "bar pink");
  }
  strip.label(days.length + 0.5, most * 0.6, "births", "");
  strip.label(days.length + 0.5, -most * 0.6, "deaths", "pink");

  const mean = days.reduce((a, d) => a + d.population, 0) / days.length;
  const births = days.reduce((a, d) => a + d.births, 0);
  const deaths = days.reduce((a, d) => a + d.deaths, 0);
  document.querySelector("#population .measured").textContent = `on average, ${mean.toFixed(1)} of ${pop}; ${births} born & ${deaths} died in ${days.length} days.`;
}

/*
----------------------------------------
a plain svg plot:
----------------------------------------
*/

const SVG = { w: 960, h: 460, left: 64, right: 72 };

//room above the highest value, so nothing presses against the top of a graph.
function headroom(v) {
  return v * 1.15;
}

function el(tag, attrs, parent) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  parent.appendChild(node);
  return node;
}

//round steps (1, 2, 5 × 10^n) from 0 to about top.
function nice_ticks(top, count = 6) {
  const raw = top / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw);
  return Array.from({ length: Math.floor(top / step) + 1 }, (_, i) => i * step);
}

/*
axes & scales in a box of the svg; returns ways to draw in it.
*/
function frame(target, o) {
  const svg = typeof target === "string" ? document.querySelector(target) : target;
  svg.setAttribute("viewBox", `0 0 ${SVG.w} ${SVG.h}`);
  const box = { top: 24, bottom: 72, ...o.box };
  const y_format = o.y_format || ((v) => String(v));

  const x = (v) => SVG.left + ((v - o.x[0]) / (o.x[1] - o.x[0])) * (SVG.w - SVG.left - SVG.right);
  const y = (v) => SVG.h - box.bottom - ((v - o.y[0]) / (o.y[1] - o.y[0])) * (SVG.h - box.top - box.bottom);
  const g = el("g", {}, svg);

  //gridlines, to read values against (at every tick):
  for (const t of o.y_ticks) el("line", { x1: SVG.left, x2: SVG.w - SVG.right, y1: y(t), y2: y(t), class: "grid" }, g);
  for (const t of o.x_ticks) el("line", { x1: x(t), x2: x(t), y1: box.top, y2: SVG.h - box.bottom, class: "grid" }, g);

  //the baseline (at 0), & ticks:
  const base = o.y[0] < 0 ? 0 : o.y[0];
  el("line", { x1: SVG.left, x2: SVG.w - SVG.right, y1: y(base), y2: y(base), class: "axis" }, g);
  for (const t of o.y_ticks) {
    el("text", { x: SVG.left - 12, y: y(t) + 5, class: "tick", "text-anchor": "end" }, g).textContent = y_format(t);
  }
  for (const t of o.x_ticks) {
    el("text", { x: x(t), y: SVG.h - box.bottom + 24, class: "tick", "text-anchor": "middle" }, g).textContent = t;
  }
  //axis labels sit apart from the ticks (x: on a line of its own, below them):
  if (o.x_label) el("text", { x: SVG.w - SVG.right, y: SVG.h - box.bottom + 52, class: "label", "text-anchor": "end" }, g).textContent = o.x_label;
  if (o.y_label) el("text", { x: SVG.left, y: box.top - 10, class: "label", "text-anchor": "start" }, g).textContent = o.y_label;

  const path = (points, key) => points.map((p, i) => (i ? "L" : "M") + x(p.x).toFixed(1) + "," + y(p[key]).toFixed(1)).join("");

  return {
    line: (points) => el("path", { d: path(points, "y"), class: "line" }, g),
    //the spread, from p5 to p95 (or any two keys):
    band: (points, lo = "p5", hi = "p95") => {
      const back = [...points].reverse().map((p) => "L" + x(p.x).toFixed(1) + "," + y(p[lo]).toFixed(1)).join("");
      el("path", { d: path(points, hi) + back + "Z", class: "band" }, g);
    },
    bar: (at, v, cls) => {
      const w = (x(1) - x(0)) * 0.6;
      el("rect", { x: x(at) - w / 2, y: Math.min(y(0), y(v)), width: w, height: Math.abs(y(v) - y(0)), class: cls }, g);
    },
    label: (at, v, text, cls) => {
      el("text", { x: x(at) + 12, y: y(v) + 5, class: "label italic " + cls, "text-anchor": "start" }, g).textContent = text;
    },
    //a key, at the top right: [{ mark: "line" | "band", text }], laid out right to left.
    key: (items) => {
      let right = SVG.w - SVG.right;
      const mid = box.top - 15;
      for (const { mark, text } of [...items].reverse()) {
        const label = el("text", { x: right, y: mid + 5, class: "label", "text-anchor": "end" }, g);
        label.textContent = text;
        right -= text.length * 7 + 8; //about the width of the text (alegreya-sans, 15px).
        if (mark === "line") el("line", { x1: right - 22, x2: right, y1: mid, y2: mid, class: "line" }, g);
        else el("rect", { x: right - 22, y: mid - 6, width: 22, height: 12, class: "band" }, g);
        right -= 22 + 24;
      }
    },
  };
}

function status(msg) {
  document.querySelector("#status").textContent = msg;
}
