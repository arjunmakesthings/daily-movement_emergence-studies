# cde: project context

my working notes on `daily-movement_emergence-studies`, on branch `cde`. they started from the project readme and the code at commit `92035c4`, and now describe the base simulation after the rework, the interpretation versions, and the analysis pages. everything up to interpretation 6 / 6.1 is committed (up to `f160b36`, "add separation."); see "where we left off" at the bottom for what isn't.

---

## what it is

- an art and software project about emergence. it takes its inspiration from casey reas' *process compendium*.
- its rules come from everyday life, not from abstract cellular rules like conway's game of life. beings are born, age, follow daily routines, move between places, stay there, reproduce and die.
- the artist never shows the simulation itself. what you see is a **software-interpretation**: an english "thought" made real as an algorithm that picks out data from the system and draws it.
- every interpretation has a header comment with **thought**, **expression**, **parameters** and a date.
- it's built with p5.js in global mode, using plain `<script>` tags with no build step. `index.html` loads the system files plus exactly one interpretation, and you switch between them by commenting tags in and out (it also has a commented-out pair of tags for the old system).

---

## layout

```
index.html                     # loads p5, system, and one interpretation; lists the current ones (.debug, 1_–6_), all commented out right now; has a commented-out toggle for the old system. (it took over from for-talk.html, which the user deleted on 3rd october.)
old-index.html                 # the previous index.html, listing the old decimal-numbered files (untracked; those paths are now in wip/)
assets/scripts/                # p5.min.js (v1.11), delaunator.min.js, save.js (all gitignored)
assets/cde/README.md           # these notes
assets/cde/analysis/           # analysis pages (see below)
  index.html, analysis.js, charts.js   # full analysis: new system vs old
  slide.html, slide.js                 # five graphs of the new system, for a slide
main/system/world.js           # World class
main/system/being.js           # Being class
main/system/old/               # the user's original system (= commit 92035c4); kept for comparison
main/interpretations/          # the current interpretation of each idea, numbered by idea (the user reorganised it on 3rd october)
  .debug.js                    # debug-mode world (user tests with: 500, 48, 15, true)
  .template.js                 # starter for new interpretations
  1_born-in-pairs.js           # world: 200, 48
  2_missed-connections.js      # world: 1000, 48, 6
  3_all-the-world's-a-mesh.js  # world: 1000 (inlines its own copy of delaunator)
  4_meetings-are-ripples.js    # world: 500, 48, 20
  5_the-collective-fabric-of-age-&-experience.js   # world: 1000, 48 (its header still says #5.1)
  6_separation.js              # world: 500, 48
  6.1_separation.js            # world: 500, 48 (a second take on 6, kept beside it; not in index.html)
  new/                         # empty, for now
  wip/                         # every earlier / alternate version: 1.1, 1.3, 1.4, 1.5, 2.0, 2.1, 3.0, 4.0, 4.1, 4.2, 5.1; and .ideas.txt
trials/                        # scratch experiments (curve tests, discarded functions, shader attempts)
paper/                         # 260806_software-study.pdf + references (wolfram, bar-yam, reas links)
```

branches: `main`, `interpretations`, `cde` (the current one).

the user's slide decks live in a separate repo, `~/data/github/presentations` (remark.js; styles in `assets/scripts/style.css`). the deck for this project is `slides/261001_emergence-study_pcd26.html`.

---

## the system: the idea in one paragraph

each being has a **routine**: a loop of a few places it frequents, mostly near one another. every day, from its own hour (`day_start`), it goes round the loop and stays at each place for a while. there is **no home**: when a being makes a new routine, it starts from the place nearest to where it is, so the places it frequents can change, and over the years a being drifts from neighbourhood to neighbourhood. how many places it *wishes* to visit (**busyness**) depends on age, with noise. how many it actually *gets* depends on its **speed** (from **energy**, which also depends on age, with noise) and on the distances involved: every slot is long enough for the trip plus a stay. a personal **vigor** links energy and lifespan, since vigorous beings have more energy and live longer. the world keeps its population near its starting size: beings die by chance once a day and are born when the world is short of beings.

---

## `World` (`main/system/world.js`)

`new World(w, h, init_population = 4, day_length = 24, max_mass = 10, debug_mode = false)`

**time**
- **a day is always 24 hours (`day_hours`), and beings live it the same way in every world.** `day_length` only sets how long it lasts on screen: `day_frames = day_length × 60` frames (~`day_length` seconds at 60fps), so `hour_length = day_frames / 24` frames (60 at `day_length` 24; 12.5 at 5). it's the world's playback speed: a smaller `day_length` plays the same day faster, so beings move faster on screen (that's how the user slows things down: a larger `day_length`). the simulation also slows down if the frame rate drops.
- `time` is the hour of the day (0–23, rounded down; exposed). `clock` is the time of day in hours, incl. fractions (0–24); slots run on it.
- `new_hour` and `new_day` are true on the first frame of each hour or day (an hour needn't be a whole number of frames; a new hour is the first frame past its mark).

**places**
- `max(2, floor(pop/4))` places, each `{ pos, crowd }`, laid out on a golden-angle (sunflower) spiral within `reach = 0.45 * min(w,h)` of the centre. (these were `hotspots` in the old system, as `[x, y]` arrays. the old concentric-circle layout is still in the file, commented out.)
- `place_spacing` ≈ `reach * sqrt(π / n)`: roughly the distance between neighbouring places.
- `count_crowds()` runs every frame and counts the beings *staying* at each place (their `place`).
- `get_place_radius(place)` = the room its crowd takes up + `max_mass`. a place grows with its crowd, so newcomers "arrive" at the edge of the crowd and can't get trapped.

**rules of the world**
- `pace = place_spacing / (0.75 * hour_length)`: pixels per frame at full energy (10). at full energy a being reaches a neighbouring place in about ¾ of an hour, so speed follows the world's own layout (sparse worlds move faster on screen) and its playback speed (shorter `day_length`, faster on screen). in a 1440×900 world of 500 (places ~64px apart), a travelling adult moves ~6.1 px/frame at `day_length` 5, ~1.3 at 24, ~0.85 at 36, ~0.64 at 48.
- `min_stay = 1` hour: the shortest stay at any place.

**each frame (`run()`)**
1. in debug mode, draw a white background.
2. `keep_time()`, then `count_crowds()`.
3. `being.exist()` for every being.
4. if there are more than 2 beings: `prevent_collisions()`, then `kill_and_make_beings()`.
5. `being.constrain()` for everyone (after collisions, so newborns can't be pushed out of the world).
6. in debug mode, `show_debugs()`: places as red squares, `[0]` label, and a console log once per hour of exactly what `beings[0]` exposes to interpretations, by the readme's names.

**death and birth (`kill_and_make_beings`)**
- once a day, at a random `killing_time` hour (on that hour's first frame), if the population is above 95% of its starting size, each being dies with `being.get_death_chance()`.
- whenever the population is below its starting size, beings aged 18–45 (in shuffled order) may reproduce. **a pair has at most one child per round** (a `had_child` set; a round is one frame).

**collisions (`prevent_collisions`)**: a spatial grid (cell size = the largest mass, numeric keys), 2 passes, 0.5 slop. overlapping pairs are pushed apart symmetrically.

**initialize()**: beings at random positions (5% margin). ages are `gaussian(32, 18)` clamped to 0–80.

---

## `Being` (`main/system/being.js`)

constructed as `new Being(x, y, age)`. it reads the global `world`.

**exposed to interpretations** (as listed in the project readme): `age`, `pos`, `mass`, `energy`, `destination` (a p5.Vector: the position of the place it's heading for or staying at; `null` until it first moves, at 2), `busyness`, `schedule` (`[[start, end], ...]` in whole hours, 0–23, like `world.time`), `get_speed()`, `get_neighbours()`. inside the system there's also `place` (that place itself, with its crowd: the world counts crowds with it, & arrival is measured against its radius) and `state` (`"travelling"` / `"staying"`; 2.2 missed connections reads it); the readme lists neither. the debug log (once an hour, for `beings[0]`) prints exactly the exposed list, by the same names.

**traits (`maxes`, random rather than inherited)**
- `max_mass`: `gaussian(10, 6)` clamped to `[min(5, world.max_mass), world.max_mass]`. `max_mass_age` is about 18.
- `speed_mult`: 0.75–1.25, a personal walking pace.
- `range`: `place_spacing * e^gaussian(0.4, 0.6)`, how far a being is willing to go. most stay local and a few roam.
- `vigor`: `e^gaussian(0, 0.2)`. it scales energy, and its inverse (frailty) scales the probability of dying.

**body over age**
- **mass:** asymptotic exponential growth towards `max_mass` by about 18. it's drawn size and collision size only; **it doesn't affect speed**.
- **energy:** `10 * vigor * rise * (0.2 + 0.8 * fall)`, where rise is a logistic centred on 12 (scale 3) and fall is a logistic centred on 50 (scale 7). it climbs through childhood, plateaus in the 20s and 30s, is about 60% of that at 50, and keeps a floor of 20%.
- **speed:** `world.pace * (energy / 10) * speed_mult`, in px/frame.
- **probability of dying today (`get_death_chance`):** `(0.0002 + 0.12 * (age/100)^3) * (1/vigor)^2`. about 0.1% at 20, 1.5% at 50, 6% at 80, 12% at 100.

**the routine**
- `day_start`: the hour at which this being's day starts, random and frame-exact. it keeps beings from moving in lockstep.
- `busyness`: places wished for per day. it's the user's formula, unchanged: a gaussian around age 25 (σ 10) between `min 2` and `max 12`, with more noise at the extremes (a day is always 24 hours, so it isn't scaled).
- `get_new_destinations(n)`: builds the routine, a closed loop. it starts at the place nearest to the being (`get_nearest_place()`), then picks each next place near the last one (likelihood `e^(-distance / range)`). a place is only added if there's time to get there, stay and get back round to the first place, and it prefers places that still leave room for the remaining wished-for stops.
- `get_timings()`: lays the loop out from `day_start`. each slot is `[start, end]` in fractional hours: the trip there plus `min_stay`. spare time is split into random shares across the stays. if a slower body can't fit the whole loop, the last places are dropped (with one place left, it stays there all day).
- `slots`: the closed loop of `[start, end]` slots in hours, incl. fractions (internal), with `destinations[i]` the place for slot `i`. `schedule` is a getter that gives the same slots in whole hours (rounded down, like `world.time`), for interpretations and the debug log.
- `follow_schedule()`: every frame, if the current slot (by `world.clock`) has changed, the being leaves for that slot's place (`place`, at `destination`), even if it hadn't arrived yet. it stays put if it's already there.
- `move()`: travels in a straight line, without overshooting, and switches to `state = "staying"` on arrival.

**birthdays (`get_curr_age`, every world midnight: 1 day = 1 year)**
- age +1, and mass and energy are recomputed.
- the routine changes (new places) always for ages 2–6, with a 50% chance for ages 7–60, and 25% after 60. otherwise the same places are re-timed for the body's new pace.
- the new plan is stored in `next_plan` and only taken up at the being's own `day_start` (`take_up_plan()`), so nobody re-plans in lockstep at midnight. a new routine then starts where the being is (the last place of its old loop).
- beings under 2 don't move.

**other**
- `reproduce(unavailable)`: needs a neighbour aged 18–45 who isn't already a parent this round. the chance is a logistic window over 18–40, × 0.2. the newborn appears between the two parents (on the road too, which is fine).
- `get_neighbours(radius = 2 * world.max_mass, beings)` is used by interpretations.
- `get_distance(a, b)` uses plain arithmetic, because `p5.Vector.dist` creates a vector on every call.
- `show()` (debug only): a circle shaded by age, plus an arrow when far from the destination (the user's original condition).

---

## the old system (`main/system/old/`)

the user's original, kept untracked for comparison (identical to commit `92035c4` apart from two trailing spaces). what's different from the new one, as measured by the analysis page (1440×900, 500 beings, 5-hour days, max mass 10):

- **destinations are random hotspots from the whole world**, about 400px away on average, and adults walk at about 1px a frame (`speed = energy / mass`; `speed_mult` is never applied). a trip takes longer than a 5-hour day, and a being only picks its next destination once it has arrived, so **~98% of beings are travelling at any moment**, and 36–38% of 18–45s reach no place all day.
- **departures bunch on the hour** (a being leaves only when `world.time` matches a slot): 23% of departures fall in the busiest 1% of moments.
- **the death roll runs on every frame of the killing hour**, until the world is down to 95%; births refill it, and it culls again. ~680 deaths in 27 days (vs ~165 in the new one), and nobody lives past their late 40s.
- **in short days the schedule runs out of hours**: slots past the day's hours get `undefined` start hours and never come. nearly everyone plans ~4 slots, whatever their age.
- the busyness loop runs `while (i < busyness)` with `i` a random index, not a count, so the schedule length is random; the wished-for busyness is never stored.
- all birthdays fall on the same frame, so everyone re-plans at once.
- no home, no vigor, no stays (a being "arrives" within its own mass of a hotspot point).

---

## analysis pages (`assets/cde/analysis/`)

open them through the local server (the user runs it). no build step and no libraries.

**`index.html`: the full analysis, new vs old.** it fetches both systems' `world.js` & `being.js` and runs each in its own scope (both name their classes `World` & `Being`). each system has an adapter in `analysis.js` (`SYSTEMS`) that says how its beings are measured (the old one keeps no busyness, state, vigor or chance of death: its wish is a copy of the old formula, its death chance a copy of the old inline formula, and "travelling" is the old code's own test, `dist ≥ mass`). the hidden canvas is resized to the world, because the old `constrain()` uses p5's `width` & `height`. new is blue & solid, old orange & dashed, everywhere.
1. **the math:** energy, speed, places wished for, places planned, probability of dying (per roll), share still alive.
2. **relationships and odds:** energy vs places planned (one scatter per system), and how likely the unlikely is (a table with both).
3. **the simulation:** population, places reached a day as lived, share travelling over time (the "flow"), time spent travelling, age at death.
4. **checks:** 13 checks, with a pass / fail / n/a for each system.
5. **many cases:** the main numbers across 10 world setups, a row per system.

**`slide.html`: five graphs of the new system, for a slide.** styled after the user's presentations `style.css` (their greys & pink, alegreya & alegreya-sans from google-fonts, lowercase, captions with a left border). each graph is its own 16:9 section with a title, gridlines, a key at the top right ("average" line, grey "range"), and a caption describing the nature of its equation:
1. busyness over age (a gaussian bell-curve, noise wider away from the peak).
2. energy over age (two logistic curves, multiplied, above a floor; scaled by log-normal vigor).
3. probability of dying over age (a cubic curve above a small floor; scaled by frailty²).
4. movement over a being's day: pixels travelled in each hour of its own day (no equation: it emerges from the schedule).
5. population with births & deaths (a feedback loop around a set point).

the world is set in `CONFIG` at the top of `slide.js` (1440×900, 500 beings, `day_length` 24, max mass 10, 20 days). `day_length` only changes how fast a day plays, not the graphs. (the slide's numbers were measured before the day-length change; re-run it to refresh them.)

for headless testing i run the pages in node with a p5 stand-in and a tiny fake dom (kept in the session scratchpad, not in the repo; see the bottom).

---

## measured (user's debug setup: 1440×900, 500 beings, `day_length` 24, max mass 15; after the day-length change)

- a travelling adult moves at about 1.3 px/frame (~77 px/s). on screen, speed scales with 1 / `day_length` (see `pace`). about 28–35% of beings are travelling at any moment (median 32%), steady through the day. departures are evenly spread (1.9% in the busiest 1% of moments).
- places planned, 18–35 / 36–59 / 60+: about 11 / 4 / 2. places reached a day: ~9.5 in the 20s & 30s, ~5 in the 40s, ~3 in the 50s, ~2.5–2.8 over 60. nobody aged 18+ is at one place all day; 0.1% of 18–45s reach no place on a given day. since a day is always 24 hours, these are the same in every `day_length`.
- median lifespan is about 62 (low vigor), 70 (middle), 78 (high). 18.5% die before 50, about 15% live past 90, and about 7% reach 100.
- the population stays at 500 at every day's end; it's back to full within 1–2 frames of a death.
- long journeys: before the day-length change, in 24-hour days, 2.1% of trips were over 5 place-spacings and the longest was 10.7 (nearly across the world); a single trip can take up to ~11 hours. (in short days they were impossible; now every world's day is 24 hours.)
- **before the day-length change** (5-hour days, speed fixed per 60 frames), short days fitted only 2–3 places and over-60s were ~93% at one place all day; that's gone.
- **removing home** (measured in 5-hour days, before the day-length change) cut the share travelling from ~22% to ~18% and places reached by young adults from ~2.5 to ~2.2: a new routine now starts where the being is, instead of with a walk home. it also stopped beings from clumping: over 400 days, with home, homes clustered (newborns are born by their parents) until 67 of 125 places went unused and the busiest had 8× the average; without home, at most 7 go unused, the busiest has ~3–4× the average, and routines lean only slightly to the centre (~57% of loop places in the inner half of the area, vs ~46% at the start).

**births & deaths, checked** (before the day-length change: instrumenting the real `World` & `Being` over 300 days of 5-hour days, 60 of 24-hour days, and 300 days of a 50-being world; the rules haven't changed since, only the killing hour is now one of 24):
- deaths happen only on the first frame of the killing hour, once a day, and never while the world is at or below 95%.
- deaths match `get_death_chance` (e.g. 2164 vs 2107 expected, 419 vs 433, 222 vs 226: within noise).
- births happen only when the world is short; both parents are always 18–45 and neighbours; no being is a parent twice in a round; every newborn appears exactly between its parents, at age 0.
- the age structure stays steady over 300 days (median ~32–36; ~175–205 beings aged 18–45 of 500). in a 50-being world, it can take up to ~3 hours to refill (fewer adult neighbours).
- no deaths on day 1: the first killing hour is 0, and frame 0 never runs (p5 starts at frame 1). harmless.

---

## the user's preferences (from these sessions)

- writes in lowercase. ask before acting (files, memory, etc.). never run a dev server; the user runs it.
- **all code is strictly lowercase, unless it's necessary** (names that p5 or javascript define, like `TWO_PI`, `CLOSE`, `HSL`, `Math`, `World`). that includes constants: `size`, not `SIZE`; `max_nodes`, not `MAX_NODES`.
- **don't run headless tests for interpretations**; the user tests them visually in the browser.
- **don't add concepts that weren't in the original system** (e.g. home) without asking; the user's original is in `main/system/old/`.
- **don't change visual styles that weren't asked about** (e.g. the debug places are red *squares*). keep their comments and structure; the code should be obvious, disciplined and smart. no quick fixes: understand the bigger picture first.
- movement must look **calm and free-flowing**. no jarring speed, and no everyone-moves-at-once moments.
- **noise is intended**: unlikely things (a busy 60-year-old) must be possible, just not likely. graphs should show the range, not just the average.
- births on the road are fine. children not going out much is fine. travelling share as it is is fine.
- **an interpretation's "thought" is always the user's; never edit it** (leave it as a `//` placeholder until they write it). when changing an interpretation, rewrite its "expression" (the technical implementation) so it describes exactly what the code does.
- **change interpretation files in place** (said on 3rd october, replacing the earlier "make a new version file" rule). a new version file only when the user asks for one (e.g. "make another 6.1").
- the user tweaks knobs in the files between requests (and sometimes un/comments `background`): always re-read a file before editing it, and keep their values.
- **expose knobs** as lowercase constants at the top of an interpretation, with a comment saying what raising / lowering does (e.g. `weight_mult`).
- for anything presentation-like, follow their `style.css` (presentations repo): simple, greys + pink, alegreya. graphs need gridlines, a key, and captions that say what kind of curve it is (e.g. "asymptotic growth").
- when testing or describing, say plainly what was and wasn't checked (e.g. headless node runs vs. a browser).

---

## open threads

- **dying before 50 (18%)** comes from the cubic death formula; left as the user's.
- **beings that can't reach another place in a day stay at one place all day** (now rare: mostly 2–6-year-olds, whose energy is near zero). the user would like slow beings to still move a bit, perhaps to closer destinations; not done, and not yet measured who's affected after the day-length change.
- **interpretations were tuned before the day-length change**, when speed didn't depend on `day_length`. their short days (`d` = 5 or 10) now play 2.4–4.8× faster on screen; the user is reworking them by hand.
- **sparse worlds** (few beings on a big canvas) move faster on screen, since speed follows place spacing.
- **a day opens with the trip from the loop's last place back to its first** (where its last day ended), and its last stay runs into the next day. so beings spend the "night" wherever their loop ends.
- **a round of births is one frame**, so a being can have children on consecutive frames (in practice refilling takes 1–2 frames).
- some older interpretation header comments still leave out `max_mass` (the project readme is fixed, as are 1.6, 2.2 and 4.2).
- **4.x ripple cap:** at most 100 ripples, each living about 11–24s, limits how many meetings get a ripple (in both 4.1 and 4.2). faster fading or a higher cap would show more meetings, but it changes the look, so it's left for the user to decide.
- `3.0` inlines all of delaunator although `assets/scripts/delaunator.min.js` exists (only a cleanup; not done).

---

## interpretations

on 3rd october the user reorganised `main/interpretations/`: the current version of each idea is now `<number>_<title>.js` (its header says `#<number>`), and every earlier version is in `wip/` (with its decimal number: 1.5, 4.2, …). the user tunes the current ones by hand, and tests them visually (no headless tests).

| file | title | world `(pop, day_length, max_mass)` | what's drawn |
|---|---|---|---|
| `1_` | born in pairs | 200, 48 | red thread of fate. beings are paired at setup by proximity & age. only the **first 2 pairs** are drawn (on purpose: population 200, 4 shown): bundles of red lines in HSL, closer pairs with more, thicker, more saturated lines, with noise jitter; accumulating. (built on 1.6: pairs by proximity & age, a thread that never breaks, and ends when one of the pair dies.) |
| `2_` | missed connections | 1000, 48, 6 | on white, cleared every frame: a line from each being to its neighbours within `3 × mass`, **only while one of the two is travelling** (reads the internal `state`); the closer, the thicker. (built on 2.2.) |
| `3_` | all the world's a mesh | 1000 (default day length 24) | a delaunay triangulation of all being positions, every frame; accumulating. |
| `4_` | meetings are ripples | 500, 48, 20 | on black, never cleared: **only moving beings** (`state === "travelling"`) draw a faint black line to one close neighbour (changed 3rd october; reads the internal `state`, which the readme doesn't list). a meeting (coming close until parting) sends one ripple of jittered white points at its closest moment; closer meetings go further; at most 100, none within 20px of another. (built on 4.2.) |
| `5_` | the collective fabric of age & experience | 1000, 48 | see below. |
| `6_` | separation | 500, 48 | see below. |
| `6.1_` | separation (spikes) | 500, 48 | see below. |

**5 (made 3rd october, as 5.1: ageing; renamed by the user):** each being is a polygon around its position. its nodes sit on a smooth form of its own (a closed loop of 3d noise), which drifts as the being ages (`form_drift`, continuous through the day); each node also wanders a little off it (`node_wander`, `node_wander_speed`). a polygon starts as a triangle, and gains 1–4 nodes a day (a day is a year) at random moments, in the widest gaps (wider gaps likelier): so the young are sharp and the old fluid (~250 nodes at 100). size = `mass × shape_size × size_by_age(age) × impact`, where `size_by_age` goes 0.4 → 1.2 over 0–100 and `impact` is a log-normal of the being's own (`impact_spread`): older beings are likely bigger, but some young ones are big and some old ones small. line colour: the younger, the darker; the older, the whiter (0 → black, 100+ → white). drawn every frame, never cleared. the knobs are lowercase constants at the top of the file. the user has since been editing it (the current header says "the collective fabric of age & experience"; a copy as 5.1 is in `wip/`).

**6, separation (made 3rd october):** places separating themselves from the places around them. the thought is still a `//` placeholder (the user's to write). on white, never cleared:
- each place's **surroundings** are its `neighbours_n` nearest places (worked out once, in setup).
- every frame, the beings **staying** at a place (reads the internal `.state` & `.place`) are grouped by **side**: the surrounding place lying most in the direction from the place to the being.
- per side, their directions (being → place) are averaged **as lines, not arrows** (doubled angles), so beings on opposite ends agree instead of cancelling.
- each being on a side draws **its own line**, orthogonal to the side's average, halfway between the place & that surrounding place. so a bigger crowd on a side = more lines there, near & on top of each other.
- each line is nudged by the being's own slowly drifting noise (`drift`): shifted along the gap (`shift`), tilted (`tilt`), & its own thickness (`weights`, scaled by `weight_mult`).
- line length grows with the number of beings at the place (`line_lengths` from 1 being to `full_crowd`), as a share of the gap.
- colour: each being is democrat blue or republican red (random, kept); darker at the central places, lighter towards the world's reach. alpha per line is fixed (`line_alpha`): strength comes from how many lines pile up.

**6.1, separation (spikes; made 3rd october):** each staying being grows a **spike** (a triangle, as wide as its `mass`) towards the nearest being staying at each of its place's surrounding places. beings themselves aren't drawn.
- each spike reaches a share of the way (`reach`, random per pair of beings, kept).
- spikes don't pop: a spike **grows in** (length & opacity, smoothstep-eased) over `grow_frames`, **turns** gradually when its nearest being changes (`apex_ease`), and **fades out** where it last was when its being leaves or that place empties.
- shade: each being cycles **smoothly black → white → black** (a cosine, so equal time near each end), at its own phase & pace (`shade_period`, ±25%). (it was noise, which sits mostly at mid-grey and read as too dark.)
- `opacity` is a spike's opacity at full growth. the user accumulates (`background(255, 20)` fade is commented out right now). note: white spikes don't show on white, so the image still leans dark; a mid-grey background would fix that (offered, not taken up).

## where we left off (3rd october 2026)

- **committed (up to `f160b36`, "add separation."):** the base system (no home; day length as playback speed; 24-hour `world.time` & `.schedule`; `destination` as a p5.Vector), the readmes, the analysis pages, `main/system/old/`, the reorganised interpretations (`1_`–`5_` and `wip/`), and `6_` & `6.1_` as described above.
- **not committed yet:** `for-talk.html` deleted, `index.html` reworked into the talk list, `old-index.html` added, and these notes.
- **6 & 6.1:** checked only that they parse (`node --check`); the user tests them visually. 6.1 has no tag in `index.html` yet.
- **the base system:** the user is happy with it for now ("kind of okay"): to slow beings down, they raise `day_length`.
- **checked headlessly only:** both analysis pages and the debug world run end to end in node. the analysis pages haven't been looked at in a browser by me. interpretations are tested visually by the user only.
- **next likely steps:**
  1. the user keeps tuning interpretations by hand (incl. 5, 6, 6.1; 6's thought is still to be written), and preparing the talk (`index.html`; the deck is `slides/261001_emergence-study_pcd26.html` in the presentations repo).
  2. maybe list `.state` (2, 4, 6, 6.1) & `.place` (6, 6.1) in the readme, or not.
  3. decide the 4.x ripple cap and lifetime.
  4. the open threads above (e.g. beings stuck at one place getting "closer destinations").
  5. commit when the user asks; `cde` is the current branch and `main` the main branch.
- **headless testing setup** (it lives in the session scratchpad, so it's gone after a session; recreate it if needed):
  - load `world.js` and `being.js` in node with `vm.runInThisContext` (not a separate `vm` context: global lookups there are about 10× slower and skew timings).
  - stub p5: `createVector` with a small vector class (add, sub, mag, magSq, setMag, heading, copy, set, dist, div, mult, normalize, plus static sub, dist, add and mult), `constrain`, `random` (accepting an array or a range), `randomGaussian`, `shuffle`, `PI`, `sqrt`, `cos`, `sin`, `noStroke`, `createCanvas`/`resizeCanvas` (setting `width`/`height`), `p5.Vector`. drive `frameCount` yourself.
  - for the analysis pages: stub `fetch` to read files from disk, and a tiny fake dom (`createElement(NS)`, `setAttribute`, `appendChild`, `insertBefore`, `querySelector`, `textContent`).
  - for interpretations and debug mode, also stub the drawing calls (`line`, `point`, `stroke`, `push`, `translate`, …) and `noise`, `dist`, `map`, `width`, `height`.

---

## how to run

open `index.html`, `assets/cde/analysis/index.html` or `assets/cde/analysis/slide.html` through a local static server; the user runs it. change which interpretation loads by uncommenting its `<script>` tag. `save.js` (commented out) saves a jpeg on mouse press.
