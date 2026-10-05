# cde: project context

my working notes on `daily-movement_emergence-studies` (branch `cde`). they describe the base system, the interpretations, the analysis pages and the paper, as of 4th october 2026. everything up to `3761dbf` ("paper updates.") is committed.

---

## what it is

- an art and software project about emergence, inspired by casey reas' *process compendium*.
- its rules come from everyday life, not abstract cellular rules: beings are born, age, keep daily routines between places, stay, reproduce and die.
- the simulation itself is never shown. what you see is a **software-interpretation**: an english "thought", made real as an algorithm that picks data out of the system and draws it.
- every interpretation has a header comment with **thought**, **expression**, **parameters** and a date.
- p5.js in global mode, plain `<script>` tags, no build step. `index.html` loads the system plus exactly one interpretation (un/comment its tag).

---

## layout

```
index.html                     # p5, the system, & one interpretation (.debug, 1_–6_; all commented out); a commented-out toggle for the old system
old-index.html                 # the previous index.html (old decimal-numbered files, now in wip/)
assets/scripts/                # p5.min.js (v1.11), delaunator.min.js, save.js
assets/cde/README.md           # these notes
assets/cde/analysis/           # analysis pages (see below)
main/system/world.js           # World
main/system/being.js           # Being
main/system/old/               # the user's original system (= commit 92035c4), kept for comparison
main/interpretations/          # the current version of each idea: <number>_<title>.js
  .debug.js, .template.js      # debug world (user tests with: 500, 48, 15, true); starter for new ones
  1_ … 6_, 6.1_                # see "interpretations"
  wip/                         # every earlier version (1.1–5.1) & .ideas.txt
  new/                         # empty
trials/                        # scratch experiments
paper/                         # 260806_software-study.pdf (old talk notes), references/, & latex/ (the paper; see below)
```

branches: `main`, `interpretations`, `cde` (current). the talk deck lives in `~/data/github/presentations` (remark.js): `slides/261001_emergence-study_pcd26.html`, media in `assets/media/261001_emergence-study/`.

---

## the system in one paragraph

each being has a **routine**: a closed loop of a few nearby places. every day, from its own hour (`day_start`), it goes round the loop and stays at each place for a while. there is **no home**: a new routine starts from the place nearest to where the being is, so over the years it drifts between neighbourhoods. how many places it *wishes* for (**busyness**) depends on age, with noise; how many it *gets* depends on its **speed** (from **energy**, which depends on age and **vigor**) and on distance. a day is always 24 hours, and a day is a year of age. the world keeps its population near its starting size: beings die by chance once a day, and are born when the world is short.

---

## `World` (`main/system/world.js`)

`new World(w, h, init_population = 4, day_length = 24, max_mass = 10, debug_mode = false)`

- **time:** a day is always 24 hours (`day_hours`). `day_length` only sets how long it lasts on screen (`day_length × 60` frames): it's playback speed; a larger `day_length` slows beings down on screen. `time` = hour (0–23), `clock` = hours incl. fractions; `new_hour` / `new_day` flags.
- **places:** `max(2, floor(pop/4))`, each `{ pos, crowd }`, on a golden-angle (sunflower) spiral within `reach = 0.45 × min(w, h)` of the centre. `place_spacing ≈ reach × sqrt(π / n)`. `get_place_radius(place)` grows with the crowd, so newcomers arrive at its edge.
- **pace** = `place_spacing / (0.75 × hour_length)`: at full energy, a neighbouring place in ~¾ hour. (sparse worlds move faster on screen.) `min_stay = 1` hour.
- **each frame (`run()`):** keep time → count crowds → `being.exist()` for all → (if > 2 beings) collisions, then deaths & births → `being.constrain()` → debug drawing/log.
- **death & birth:** once a day at a random hour, if population > 95% of start, each being dies with `get_death_chance()`. whenever population < start, 18–45s (shuffled) may reproduce with a neighbour; a pair has at most one child per round (one frame).
- **collisions:** spatial grid, 2 passes, 0.5 slop, symmetric push.
- **initialize():** random positions (5% margin), ages `gaussian(32, 18)` clamped 0–80.

## `Being` (`main/system/being.js`)

- **exposed to interpretations** (project readme): `age`, `pos`, `mass`, `energy`, `destination` (p5.Vector; `null` until it first moves, at 2), `busyness`, `schedule` (`[[start, end], …]`, whole hours), `get_speed()`, `get_neighbours(radius = 2 × max_mass)`. also read by some interpretations but not in the readme: `state` (`"travelling"` / `"staying"`; used by 2, 4, 6) and `place` (used by 6).
- **traits (random, not inherited):** `max_mass` `gaussian(10, 6)` clamped to `[min(5, M), M]`; `speed_mult` 0.75–1.25; `range = place_spacing × e^gaussian(0.4, 0.6)`; `vigor = e^gaussian(0, 0.2)`.
- **body:** mass grows asymptotically to max by ~18 (size only, not speed). energy = `10 × vigor × rise × (0.2 + 0.8 × fall)`, logistic rise at 12 and fall at 50. speed = `pace × energy/10 × speed_mult`.
- **death chance:** `(0.0002 + 0.12 × (age/100)³) / vigor²`: ~0.1% at 20, 1.5% at 50, 6% at 80, 12% at 100.
- **routine:** busyness = the user's gaussian around 25 (σ 10), 2–12, noisier away from the peak. `get_new_destinations(n)`: start at the nearest place, then each next place near the last (`e^(-d / range)`), only if the loop can still close within 24 h (preferring places that leave room for the rest). `get_timings()`: slots = trip + `min_stay`, spare time split randomly; drops last places if the body is too slow. `follow_schedule()` leaves for the current slot's place (even if it hadn't arrived); `move()` goes straight there.
- **birthdays** (world midnight): age +1, mass & energy recomputed; new routine always at 2–6, 50% at 7–60, 25% after 60, otherwise re-timed. taken up at the being's own `day_start` (no lockstep). under-2s don't move.
- `reproduce()`: neighbour aged 18–45 & available; chance = logistic window 18–40 × 0.2; newborn between the parents.

## the old system (`main/system/old/`)

the user's original (commit `92035c4`). the paper's "revising the ground" section compares it to the new one (1440×900, 500 beings, 5-hour days):
- destinations random from the whole world (~400px), adults ~1px/frame → ~98% travelling at any moment; 36–38% of 18–45s reach no place all day.
- departures bunch on the hour (23% in the busiest 1% of moments).
- death roll on every frame of the killing hour → ~4× the deaths; nobody past their late 40s.
- short days run out of hours → ~4 slots whatever the age. everyone re-plans at once. no home, vigor or stays.

---

## measured (headless node runs; 1440×900, 500 beings, `day_length` 24)

- ~28–35% of beings travelling at any moment (median 32%), steady through the day; departures even (1.9% in the busiest 1% of moments).
- places planned, 18–35 / 36–59 / 60+: ~11 / 4 / 2. reached a day: ~9.5 (20s–30s), ~5 (40s), ~3 (50s), ~2.5–2.8 (60+). no 18+ at one place all day; 0.1% of 18–45s reach none.
- median lifespan ~62 / 70 / 78 (low / middle / high vigor); 18.5% die before 50; ~15% past 90; ~7% reach 100.
- population back to full within 1–2 frames of a death; age structure steady (median ~32–36). deaths match `get_death_chance` within noise; births always to two neighbouring 18–45s.
- ~2% of trips > 5 place-spacings; the longest nearly crosses the world.
- **home vs no home** (measured with 5-hour days, before the day-length change): with home, over 400 days, homes clustered (newborns by their parents) until 67 of 125 places were unused and the busiest had 8× the average. without home: at most 7 unused, busiest ~3–4×, ~57% of loop places in the inner half (vs ~46% at start). the paper uses this as its emergence example.

---

## analysis pages (`assets/cde/analysis/`)

open through the local server (the user runs it). no libraries.

- **`index.html`: new vs old.** loads both systems' `world.js` & `being.js` unchanged, each in its own scope, through adapters in `analysis.js` (`SYSTEMS`). new = blue solid, old = orange dashed. sections: the math; relationships & odds; the simulation; 13 checks (pass / fail / n/a); 10 world setups.
- **`slide.html`: five graphs of the new system** (busyness, energy, dying, movement over a being's day, population with births & deaths), styled after the presentations' `style.css`. world set in `CONFIG` at the top of `slide.js`. **its numbers predate the day-length change: re-run it before the paper is submitted** (the paper's figure 2 uses these graphs).

**headless testing** (lives in the session scratchpad; recreate if needed): load `world.js` & `being.js` with `vm.runInThisContext`; stub p5 (`createVector` with a small vector class, `constrain`, `random`, `randomGaussian`, `shuffle`, `PI`, `sqrt`, `cos`, `sin`, `noStroke`, `createCanvas`/`resizeCanvas`, `p5.Vector`) and drive `frameCount` yourself. for the analysis pages also stub `fetch` and a tiny dom.

---

## interpretations

the current version of each idea is `<number>_<title>.js`; earlier versions are in `wip/`. parameter headers were corrected to match the code on 4th october.

| file | title | world `(pop, day_length, max_mass)` | what's drawn |
|---|---|---|---|
| `1_` | born in pairs | 200, 48 | beings paired at setup by closeness of birth (space & age, chained nearest-neighbour). first **4 pairs** drawn: bundles of 2–10 red lines, more / thicker / more saturated when close, noise jitter; accumulating; a thread ends when one dies. |
| `2_` | missed connections | 1000, 48, 6 | white, cleared every frame: a line to neighbours within `3 × mass` while one of the two is travelling; closer = thicker. (no still image yet.) |
| `3_` | all the world's a mesh | 1000, 24 (default) | delaunay triangulation of all beings every frame; near-transparent strokes, alternately black/white; accumulating. (inlines its own delaunator.) |
| `4_` | meetings are ripples | 500, 48, 20 | black, never cleared. travelling beings draw a faint black line to one neighbour. a meeting sends one ripple of jittered white points at its closest moment; closer = further. max 100 ripples, none within 20px of another. |
| `5_` | the collective fabric of age & experience | 1000, 48 | a polygon per being, from a triangle gaining 1–4 nodes a year (~250 at 100) on a drifting noise form; size = mass × 600 × age factor (0.1 → 1.2) × log-normal impact; young dark, old white; accumulating. |
| `6_` | separation | 1000, 48 | staying beings grouped by side (nearest of 8 surrounding places); per side, directions averaged as lines; each being draws its own orthogonal line halfway to that place, nudged by noise; longer with crowd; random blue / red per being, darker at the centre; accumulating. |
| `6.1_` | separation (spikes) | 2000, 48 | a variant: spikes from each staying being towards the nearest being at each surrounding place; shades cycle black ↔ white. thought not written; **not in the paper**. |

---

## the paper (`paper/latex/`)

the master version of an academic paper on the project, written 4th october for the user to edit; no venue yet. see `paper/latex/README.md` for compiling (overleaf, or mactex + latexmk; latex isn't installed on this mac, so it's never been compiled here) and porting to venues.

- `main.tex` (article class) + `preamble.tex` + `sections/00–10` + `references.bib` (~40 sources) + `figures/` (converted to jpg/png with `sips` from the presentations repo).
- switches at the top of `main.tex`: `\anonymous…` (blind review) and `\shownotes…` (pink `\note{}` / `\anecdote{}` boxes).
- argument: emergence in generative art usually comes from arbitrary rules; here the rules come from everyday life, and only interpretations are shown. contributions: the base system, the thought / expression / parameters format, six interpretations + the revision of the system (old vs new, & home's clustering) as a finding.
- conventions: body text in standard capitalisation; interpretation titles, thoughts, expressions & code kept lowercase, quoted exactly. **no citations in the interpretation sections** (they're from the user's lived experience; the user will add anecdotes); citations go in the context, theory & system. the red thread of fate gets one footnote; schelling is addressed in the discussion (#6's colours are random: the division is the reader's).
- candidate venues: xcoax, isea, ieee vis arts (visap), alife, siggraph art papers, c&c, eva london, generative art conference, bridges, evomusart. one venue at a time (dual-submission rules).

---

## the user's preferences

- writes in lowercase. ask before acting (files, memory, etc.). never run a dev server.
- **all code strictly lowercase unless necessary** (p5 / js names like `TWO_PI`, `Math`, `World`), constants included.
- **don't run headless tests for interpretations**; the user tests them visually.
- **don't add concepts that weren't in the original system** (e.g. home) without asking.
- **don't change visual styles that weren't asked about**; keep comments & structure; obvious, disciplined code; no quick fixes.
- movement must look **calm and free-flowing**; no everyone-moves-at-once.
- **noise is intended**: the unlikely possible, not likely. graphs show ranges, not just averages.
- **an interpretation's "thought" is always the user's; never edit it.** when changing an interpretation, rewrite its "expression" to describe exactly what the code does.
- **change interpretation files in place**; a new version file only when asked.
- the user tweaks knobs between requests: re-read a file before editing it, and keep their values.
- **expose knobs** as lowercase constants at the top of an interpretation, commented with what raising / lowering does.
- presentation-like things follow their `style.css` (greys + pink, alegreya); graphs need gridlines, a key, and captions naming the curve.
- say plainly what was and wasn't checked.

---

## open threads

- **paper:** anecdotes to write; a still for #2; re-run `slide.html` graphs; verify every reference (esp. the snowflake article's title & authors); check the cellular-automata figures' rule & the mesh images' order; add the repo link & a git tag; pick a first venue & make its wrapper.
- **#6's expression** says "the direction that they arrived from"; the code averages which side of the place each staying being is on. reword it (in the code & the paper) if the user agrees.
- **dying before 50 (18.5%)** comes from the cubic death formula; left as the user's.
- **beings that can't reach another place in a day stay put all day** (mostly 2–6-year-olds). the user would like slow beings to still move a bit; not done.
- **4's ripple cap** (100, ~11–24s each) limits how many meetings get a ripple; changing it changes the look, so it's the user's call.
- **a day opens with the trip from the loop's last place back to its first**, so beings spend the "night" wherever their loop ends.
- `3_` inlines delaunator although `assets/scripts/delaunator.min.js` exists (cleanup only).
- maybe list `.state` & `.place` in the project readme.

---

## how to run

open `index.html`, `assets/cde/analysis/index.html` or `assets/cde/analysis/slide.html` through a local static server (the user runs it). switch interpretations by uncommenting a `<script>` tag. `save.js` (commented out) saves a jpeg on mouse press.
