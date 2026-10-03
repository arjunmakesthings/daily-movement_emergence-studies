/*
small svg charts for the analysis page. no libraries; every chart has a hover readout, and a data table underneath.

- band_chart: lines over age, each with a median & two spreads (25–75%, 5–95%).
- scatter_chart: dots, with a readout for the nearest one.
- checks_table / odds_table: plain tables.
*/

const SVG_NS = "http://www.w3.org/2000/svg";

const CHART = { w: 640, h: 290, left: 52, right: 92, top: 30, bottom: 40 };

function make(tag, attrs = {}, parent = null) {
  const node = tag.startsWith("svg:")
    ? document.createElementNS(SVG_NS, tag.slice(4))
    : document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (parent) parent.appendChild(node);
  return node;
}

function text_node(tag, text, attrs = {}, parent = null) {
  const node = make(tag, attrs, parent);
  node.textContent = text;
  return node;
}

/*
round, readable ticks for a domain (1, 2, 5 × 10^n steps).
*/
function nice_ticks(lo, hi, count = 5) {
  const span = hi - lo || 1;
  const raw = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw);
  const ticks = [];
  for (let t = Math.ceil(lo / step) * step; t <= hi + step * 1e-9; t += step) {
    ticks.push(+t.toFixed(10));
  }
  return ticks;
}

/*
the smallest round number (on the tick steps) at or above v, so nothing is cut off at the top.
*/
function nice_top(v) {
  const ticks = nice_ticks(0, v);
  const step = ticks[1] - ticks[0] || 1;
  return Math.ceil(v / step - 1e-9) * step || step;
}

/*
a card: title, subtitle, a place for the chart, and a collapsible data table.
*/
function chart_card(container, title, subtitle) {
  const card = make("section", { class: "card" }, container);
  text_node("h3", title, {}, card);
  if (subtitle) text_node("p", subtitle, { class: "subtitle" }, card);
  const body = make("div", { class: "chart-body" }, card);
  return { card, body };
}

function data_table(card, columns, rows) {
  const details = make("details", {}, card);
  text_node("summary", "data:", {}, details);
  const table = make("table", { class: "data" }, details);
  const head = make("tr", {}, make("thead", {}, table));
  for (const c of columns) text_node("th", c, {}, head);
  const body = make("tbody", {}, table);
  for (const r of rows) {
    const tr = make("tr", {}, body);
    for (const cell of r) text_node("td", cell, {}, tr);
  }
}

/*
the shared frame: scales, gridlines, axes. returns helpers to place things.
*/
function frame(svg, x_domain, y_domain, x_label, y_label, y_format) {
  const { w, h, left, right, top, bottom } = CHART;
  const x = (v) =>
    left + ((v - x_domain[0]) / (x_domain[1] - x_domain[0])) * (w - left - right);
  const y = (v) =>
    h - bottom - ((v - y_domain[0]) / (y_domain[1] - y_domain[0])) * (h - top - bottom);

  const grid = make("svg:g", { class: "grid" }, svg);
  for (const t of nice_ticks(y_domain[0], y_domain[1])) {
    make("svg:line", { x1: left, x2: w - right, y1: y(t), y2: y(t) }, grid);
    text_node("svg:text", y_format(t), { x: left - 8, y: y(t) + 4, class: "tick", "text-anchor": "end" }, grid);
  }
  for (const t of nice_ticks(x_domain[0], x_domain[1], 10)) {
    text_node("svg:text", String(t), { x: x(t), y: h - bottom + 16, class: "tick", "text-anchor": "middle" }, grid);
  }
  make("svg:line", { x1: left, x2: w - right, y1: h - bottom, y2: h - bottom, class: "baseline" }, svg);
  text_node("svg:text", x_label, { x: (left + w - right) / 2, y: h - 6, class: "axis-label", "text-anchor": "middle" }, svg);
  text_node("svg:text", y_label, { x: 4, y: 12, class: "axis-label", "text-anchor": "start" }, svg);

  return { x, y };
}

function path_of(points, x, y, key) {
  return points.map((p, i) => (i ? "L" : "M") + x(p.x).toFixed(1) + "," + y(p[key]).toFixed(1)).join("");
}

function band_path(points, x, y, lo, hi) {
  const top = points.map((p, i) => (i ? "L" : "M") + x(p.x).toFixed(1) + "," + y(p[hi]).toFixed(1)).join("");
  const bottom = [...points].reverse().map((p) => "L" + x(p.x).toFixed(1) + "," + y(p[lo]).toFixed(1)).join("");
  return top + bottom + "Z";
}

/*
series: [{ name, color: css var, dashed?, bands?, points: [{ x, p5, p25, p50, p75, p95 }] }]
a series has bands unless the chart (opts.bands) or the series itself says false.
*/
function band_chart(container, opts) {
  const { title, subtitle, x_label, y_label, y_format = (v) => String(v) } = opts;
  const series = opts.series.map((s) => ({ ...s, bands: opts.bands !== false && s.bands !== false }));
  const { card, body } = chart_card(container, title, subtitle);

  const all = series.flatMap((s) => s.points.map((p) => (s.bands ? p.p95 : p.p50)));
  const xs = series.flatMap((s) => s.points.map((p) => p.x));
  const x_domain = opts.x_domain || [Math.min(...xs), Math.max(...xs)];
  const y_domain = opts.y_domain || [0, nice_top(Math.max(...all))];

  const svg = make("svg:svg", { viewBox: `0 0 ${CHART.w} ${CHART.h}`, class: "chart", role: "img", "aria-label": title }, body);
  const { x, y } = frame(svg, x_domain, y_domain, x_label, y_label, y_format);

  for (const s of series) {
    const g = make("svg:g", { style: `--c: var(${s.color})` }, svg);
    if (s.bands) {
      make("svg:path", { d: band_path(s.points, x, y, "p5", "p95"), class: "band outer" }, g);
      make("svg:path", { d: band_path(s.points, x, y, "p25", "p75"), class: "band inner" }, g);
    }
    make("svg:path", { d: path_of(s.points, x, y, "p50"), class: "median" + (s.dashed ? " dashed" : "") }, g);

    //direct label at the line's end (with the legend, for 2+ series):
    if (series.length > 1) {
      const end = s.points[s.points.length - 1];
      make("svg:circle", { cx: x(end.x), cy: y(end.p50), r: 4, class: "end-dot" }, g);
      text_node("svg:text", s.name, { x: x(end.x) + 8, y: y(end.p50) + 4, class: "direct-label" }, svg);
    }
  }

  if (series.length > 1) legend(card, series, "line");
  hover_crosshair(svg, body, series, x, y, x_domain, x_label, y_format);

  //rows at every table_step of x, from all series (they may start at different x's):
  const table_xs = [...new Set(xs)].sort((a, b) => a - b).filter((v) => v % (opts.table_step || 10) === 0);
  data_table(
    card,
    [x_label, ...series.flatMap((s) => (s.bands ? [s.name + " median", s.name + " 5–95%"] : [s.name]))],
    table_xs.map((v) => [
      String(v),
      ...series.flatMap((s) => {
        const q = s.points.find((o) => o.x === v);
        if (!q) return s.bands ? ["–", "–"] : ["–"]; //this series has no value here.
        return s.bands ? [y_format(q.p50), y_format(q.p5) + " – " + y_format(q.p95)] : [y_format(q.p50)];
      }),
    ]),
  );
}

function legend(card, series, kind) {
  const row = make("div", { class: "legend" });
  card.insertBefore(row, card.querySelector(".chart-body"));
  for (const s of series) {
    const item = make("span", { class: "legend-item" }, row);
    make("span", { class: "key " + kind + (s.dashed ? " dashed" : ""), style: `--c: var(${s.color})` }, item);
    text_node("span", s.name, {}, item);
  }
}

/*
a vertical hairline that snaps to the nearest x, with every series' value in one readout.
*/
function hover_crosshair(svg, body, series, x, y, x_domain, x_label, y_format) {
  const line = make("svg:line", { class: "crosshair", y1: CHART.top, y2: CHART.h - CHART.bottom, visibility: "hidden" }, svg);
  const tip = make("div", { class: "tooltip", hidden: "" }, body);
  const xs = [...new Set(series.flatMap((s) => s.points.map((p) => p.x)))];

  svg.addEventListener("pointermove", (e) => {
    const box = svg.getBoundingClientRect();
    const sx = ((e.clientX - box.left) / box.width) * CHART.w;
    const nearest = xs.reduce((a, b) => (Math.abs(x(b) - sx) < Math.abs(x(a) - sx) ? b : a));

    line.setAttribute("x1", x(nearest));
    line.setAttribute("x2", x(nearest));
    line.setAttribute("visibility", "visible");

    tip.replaceChildren();
    text_node("div", x_label + " " + nearest, { class: "tip-head" }, tip);
    for (const s of series) {
      const p = s.points.find((o) => o.x === nearest);
      if (!p) continue;
      const row = make("div", { class: "tip-row" }, tip);
      make("span", { class: "key line" + (s.dashed ? " dashed" : ""), style: `--c: var(${s.color})` }, row);
      text_node("strong", y_format(p.p50), {}, row);
      text_node("span", s.bands ? ` (${y_format(p.p25)}–${y_format(p.p75)}) ${s.name}` : " " + s.name, {}, row);
    }
    tip.hidden = false;
    const left = (x(nearest) / CHART.w) * box.width;
    tip.style.left = Math.min(left + 12, box.width - tip.offsetWidth - 4) + "px";
  });
  svg.addEventListener("pointerleave", () => {
    line.setAttribute("visibility", "hidden");
    tip.hidden = true;
  });
}

/*
groups: [{ name, color, points: [{ x, y, label }] }]. y can be jittered by the caller; labels carry the real values.
*/
function scatter_chart(container, opts) {
  const { title, subtitle, groups, x_label, y_label, y_format = (v) => String(v), x_format = (v) => String(v) } = opts;
  const { card, body } = chart_card(container, title, subtitle);

  const all = groups.flatMap((g) => g.points);
  const x_domain = [0, nice_top(Math.max(...all.map((p) => p.x)))];
  const y_domain = [0, nice_top(Math.max(...all.map((p) => p.y)))];

  const svg = make("svg:svg", { viewBox: `0 0 ${CHART.w} ${CHART.h}`, class: "chart", role: "img", "aria-label": title }, body);
  const { x, y } = frame(svg, x_domain, y_domain, x_label, y_label, y_format);

  for (const g of groups) {
    const layer = make("svg:g", { style: `--c: var(${g.color})` }, svg);
    for (const p of g.points) make("svg:circle", { cx: x(p.x), cy: y(p.y), r: 2.5, class: "dot" }, layer);
  }
  legend(card, groups, "dot");

  //readout for the nearest dot (a pinpoint is hard to hit; nearest is easy):
  const ring = make("svg:circle", { r: 6, class: "hover-ring", visibility: "hidden" }, svg);
  const tip = make("div", { class: "tooltip", hidden: "" }, body);
  const flat = groups.flatMap((g) => g.points.map((p) => ({ ...p, group: g })));

  svg.addEventListener("pointermove", (e) => {
    const box = svg.getBoundingClientRect();
    const sx = ((e.clientX - box.left) / box.width) * CHART.w;
    const sy = ((e.clientY - box.top) / box.height) * CHART.h;
    let best = null;
    let best_d = Infinity;
    for (const p of flat) {
      const d = (x(p.x) - sx) ** 2 + (y(p.y) - sy) ** 2;
      if (d < best_d) [best, best_d] = [p, d];
    }
    if (!best || best_d > 900) {
      ring.setAttribute("visibility", "hidden");
      tip.hidden = true;
      return;
    }
    ring.setAttribute("cx", x(best.x));
    ring.setAttribute("cy", y(best.y));
    ring.setAttribute("visibility", "visible");
    tip.replaceChildren();
    const row = make("div", { class: "tip-row" }, tip);
    make("span", { class: "key dot", style: `--c: var(${best.group.color})` }, row);
    text_node("span", best.label, {}, row);
    tip.hidden = false;
    tip.style.left = Math.min((x(best.x) / CHART.w) * box.width + 12, box.width - tip.offsetWidth - 4) + "px";
  });
  svg.addEventListener("pointerleave", () => {
    ring.setAttribute("visibility", "hidden");
    tip.hidden = true;
  });

  data_table(
    card,
    ["group", x_label + " (median)", y_label + " (median)", "n"],
    groups.map((g) => {
      const med = (arr) => [...arr].sort((a, b) => a - b)[arr.length >> 1];
      return [g.name, x_format(med(g.points.map((p) => p.x))), y_format(med(g.points.map((p) => p.raw_y ?? p.y))), String(g.points.length)];
    }),
  );
}

/*
columns: the systems' names. rows: [{ name, expect, results: [{ value, pass }] }], one result per column; pass is null when the check doesn't apply.
status always comes with an icon & a word, never colour alone.
*/
function checks_table(container, title, subtitle, columns, rows) {
  const { body } = chart_card(container, title, subtitle);
  const table = make("table", { class: "data checks" }, body);
  const head = make("tr", {}, make("thead", {}, table));
  for (const c of ["check", "expected", ...columns]) text_node("th", c, {}, head);
  const tb = make("tbody", {}, table);
  for (const r of rows) {
    const tr = make("tr", {}, tb);
    text_node("td", r.name, {}, tr);
    text_node("td", r.expect, {}, tr);
    for (const { value, pass } of r.results) {
      const td = make("td", { class: "result" }, tr);
      const [kind, word] = pass === null ? ["na", "– n/a"] : pass ? ["good", "✓ pass"] : ["critical", "✕ fail"];
      text_node("div", word, { class: "status " + kind }, td);
      text_node("div", value, {}, td);
    }
  }
}

/*
rows: [[label, value, ...], ...]; columns (optional): a header, one for each value.
*/
function odds_table(container, title, subtitle, rows, columns = null) {
  const { body } = chart_card(container, title, subtitle);
  const table = make("table", { class: "data odds" }, body);
  if (columns) {
    const head = make("tr", {}, make("thead", {}, table));
    text_node("th", "", {}, head);
    for (const c of columns) text_node("th", c, { class: "num" }, head);
  }
  const tb = make("tbody", {}, table);
  for (const [label, ...values] of rows) {
    const tr = make("tr", {}, tb);
    text_node("td", label, {}, tr);
    for (const v of values) text_node("td", v, { class: "num" }, tr);
  }
}
