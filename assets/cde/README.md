# cde: project context

my working notes on `daily-movement_emergence-studies`, on branch `cde`. they started from the project readme and the code at commit `92035c4`, and now describe the base simulation after the rework, plus the new interpretation versions. **nothing from this work is committed yet** (as of 2nd october 2026). see "where we left off" at the bottom to pick up.

---

## what it is

- an art and software project about emergence. it takes its inspiration from casey reas' *process compendium*.
- its rules come from everyday life, not from abstract cellular rules like conway's game of life. beings are born, age, follow daily routines, move between places, stay there, reproduce and die.
- the artist never shows the simulation itself. what you see is a **software-interpretation**: an english "thought" made real as an algorithm that picks out data from the system and draws it.
- every interpretation has a header comment with **thought**, **expression**, **parameters** and a date.
- it's built with p5.js in global mode, using plain `<script>` tags with no build step. `index.html` loads the system files plus exactly one interpretation, and you switch between them by commenting tags in and out.

---

## layout

```
index.html                     # loads p5, system, and one interpretation (currently .debug.js)
assets/scripts/                # p5.min.js (v1.11), delaunator.min.js, save.js (all gitignored)
assets/cde/README.md           # these notes
assets/cde/analysis/           # graphs & checks of the base simulation (see below)
main/system/world.js           # World class
main/system/being.js           # Being class
main/interpretations/          # finished ("happy with") interpretations
  .debug.js                    # debug-mode world (user tests with: 500, 5, 10, true)
  .template.js                 # starter for new interpretations
  .ideas.txt                   # idea list
  1.5_born-in-pairs.js
  1.6_born-in-pairs.js         # new (to compare with 1.5)
  2.0_missed-connections.js
  2.2_missed-connections.js    # new (to compare with 2.0; 2.1 is taken in wip/)
  3.0_all-the-world's-a-mesh.js   # inlines its own copy of delaunator
  4.1_meetings-are-ripples.js
  4.2_meetings-are-ripples.js  # new (to compare with 4.1)
  wip/                         # earlier/alternate versions (1.1, 1.3, 1.4, 2.1, 4.0)
trials/                        # scratch experiments (curve tests, discarded functions, shader attempts)
paper/                         # 260806_software-study.pdf + references (wolfram, bar-yam, reas links)
```

branches: `main`, `interpretations`, `cde` (the current one).

---

## the system: the idea in one paragraph

each being lives a routine. its day starts at its own hour (`day_start`), at **home**. it then visits a few nearby **places** and stays at each one, before going home again. how many places it *wishes* to visit (**busyness**) depends on age, with noise. how many it actually *gets* depends on its **speed** (from **energy**, which also depends on age, with noise) and on the distances involved: every slot is long enough for the trip plus a stay. a personal **vigor** links energy and lifespan, since vigorous beings have more energy and live longer. the world keeps its population near its starting size: beings die by chance once a day and are born when the world is short of beings.

---

## `World` (`main/system/world.js`)

`new World(w, h, init_population = 4, day_length = 24, max_mass = 10, debug_mode = false)`

> the project readme lists the signature as `(w, h, [n, d, db])` and leaves out `max_mass`. the actual order is **population, day_length, max_mass, debug_mode**.

**time**
- `hour_length = 60` frames. a day is `day_length` hours. at 60fps an hour is about 1s, and the simulation slows down if the frame rate drops.
- `time` is the whole hour of the day. `clock` is the time of day in fractional hours, and schedules run on it.
- `new_hour` and `new_day` are true on the first frame of each hour or day.

**places**
- `max(2, floor(pop/4))` places, each `{ pos, crowd }`, laid out on a golden-angle (sunflower) spiral within `reach = 0.45 * min(w,h)` of the centre. (these were `hotspots` before. the old concentric-circle layout is still in the file, commented out.)
- `place_spacing` ≈ `reach * sqrt(π / n)`: roughly the distance between neighbouring places.
- `count_crowds()` runs every frame and counts the beings *staying* at each place.
- `get_place_radius(place)` = the room its crowd takes up + `max_mass`. a place grows with its crowd, so newcomers "arrive" at the edge of the crowd and can't get trapped.

**rules of the world**
- `pace = place_spacing / (0.75 * hour_length)`: pixels per frame at full energy (10). at full energy a being reaches a neighbouring place in about ¾ of an hour, so speed follows the world's own layout (sparse worlds move faster on screen).
- `min_stay = min(1, day_length / 10)` hours: the shortest stay at any place.

**each frame (`run()`)**
1. in debug mode, draw a white background.
2. `keep_time()`, then `count_crowds()`.
3. `being.exist()` for every being.
4. if there are more than 2 beings: `prevent_collisions()`, then `kill_and_make_beings()`.
5. `being.constrain()` for everyone (after collisions, so newborns can't be pushed out of the world).
6. in debug mode, `show_debugs()`: places as red squares, `[0]` label, and a console log once per hour.

**death and birth (`kill_and_make_beings`)**
- once a day, at a random `killing_time` hour, if the population is above 95% of its starting size, each being dies with `being.get_death_chance()`.
- whenever the population is below its starting size, beings aged 18–45 (in shuffled order) may reproduce. **a pair has at most one child per round** (a `had_child` set).

**collisions (`prevent_collisions`)**: a spatial grid (cell size = the largest mass, numeric keys), 2 passes, 0.5 slop. overlapping pairs are pushed apart symmetrically.

**initialize()**: beings at random positions (5% margin). ages are `gaussian(32, 18)` clamped to 0–80.

---

## `Being` (`main/system/being.js`)

constructed as `new Being(x, y, age)`. it reads the global `world`.

**traits (`maxes`, random rather than inherited)**
- `max_mass`: `gaussian(10, 6)` clamped to `[min(5, world.max_mass), world.max_mass]`. `max_mass_age` is about 18.
- `speed_mult`: 0.75–1.25, a personal walking pace.
- `range`: `place_spacing * e^gaussian(0.4, 0.6)`, how far a being is willing to go. most stay local and a few roam.
- `vigor`: `e^gaussian(0, 0.2)`. it scales energy, and its inverse (frailty) scales the chance of dying.

**body over age**
- **mass:** asymptotic exponential growth towards `max_mass` by about 18. it's drawn size and collision size only; **it doesn't affect speed**.
- **energy:** `10 * vigor * rise * (0.2 + 0.8 * fall)`, where rise is a logistic centred on 12 (scale 3) and fall is a logistic centred on 50 (scale 7). it climbs through childhood, peaks in the 20s and 30s, halves around 50, and keeps a floor of 20%.
- **speed:** `world.pace * (energy / 10) * speed_mult`, in px/frame.
- **chance of dying today (`get_death_chance`):** `(0.0002 + 0.12 * (age/100)^3) * (1/vigor)^2`.

**the routine**
- `home`: the place nearest to where the being was born. every day starts and ends there.
- `day_start`: the hour at which this being's day starts, random and frame-exact. it keeps beings from moving in lockstep.
- `busyness`: places wished for per day, including home. it's the user's formula: a gaussian around age 25 (σ 10) between `min 2` and `max round(12 * day/24)`, with more noise at the extremes. it's thought of in a 24-hour day and scaled to the world's day.
- `get_new_destinations(n)`: builds the route. it starts at home, then picks each next place near the last one (likelihood `e^(-distance / range)`). a place is only added if there's time to get there, stay and get back home, and it prefers places that still leave room for the remaining wished-for stops.
- `get_timings()`: lays the route out from `day_start`. each slot is `[start, end]` in fractional hours: the trip there plus `min_stay`. spare time is split into random shares across the stays. if a slower body can't fit the whole route, the last places are dropped.
- `schedule`: the closed loop of slots, with `destinations[i]` the place for slot `i`.
- `follow_schedule()`: every frame, if the current slot (by `world.clock`) has changed, the being leaves for that slot's place, even if it hadn't arrived yet. it stays put if it's already there.
- `move()`: travels in a straight line, without overshooting, and switches to `state = "staying"` on arrival.
- `state` is `"travelling"` or `"staying"`. `place` is the place it's heading for or staying at.

**birthdays (`get_curr_age`, every world midnight: 1 day = 1 year)**
- age +1, and mass and energy are recomputed.
- the routine changes always for ages 2–6, with a 50% chance for ages 7–60, and 25% after 60. otherwise the same route is re-timed for the body's new pace.
- the new plan is stored in `next_plan` and only taken up at the being's own `day_start` (`take_up_plan()`), so nobody re-plans in lockstep at midnight.
- beings under 2 don't move.

**other**
- `reproduce(unavailable)`: needs a neighbour aged 18–45 who isn't already a parent this round. the chance is a logistic window over 18–40, × 0.2. the newborn appears between the two parents (on the road too, which is fine).
- `get_neighbours(radius = 2 * world.max_mass, beings)` is used by interpretations.
- `get_distance(a, b)` uses plain arithmetic, because `p5.Vector.dist` creates a vector on every call.
- `show()` (debug only): a circle shaded by age, plus an arrow when far from the destination (the user's original condition).

---

## analysis tool (`assets/cde/analysis/`)

open `index.html` through the local server. it loads p5 and the real system files, with no build step and no libraries (hand-made svg charts in `charts.js`). the inputs are width, height, population, day length, max mass, days to simulate and beings per age.

1. **the math:** many beings sampled at every age give energy, speed, busyness (wished vs planned), chance of death (all with 25–75% and 5–95% bands), and survival by vigor third.
2. **relationships and odds:** a scatter of energy vs places planned, and how likely the unlikely is (e.g. a 60-year-old busier than a 23-year-old).
3. **the simulation:** population, places per day as lived, share of beings travelling over time (the "flow"), time spent travelling, and age at death (simulation vs math).
4. **checks:** 13 pass/fail checks for this world.
5. **many cases:** the main numbers across 10 world setups.

for headless testing i run the same files in node with a p5 stand-in (kept in the session scratchpad, not in the repo).

---

## measured (user's debug setup: 1440×900, 500 beings, 5-hour days, max mass 10)

- adults move at about 1.4 px/frame. about 20–27% of beings are travelling at any moment, and that share is steady through the day. departures are evenly spread.
- 18–35: about 3 places a day, about 2.6 trips. 36–59: about 2, with 8% home all day. over 60: about 93% home all day (it's 20% in 10-hour days and 0% in 24-hour days).
- median lifespan is about 62 (low vigor), 70 (middle), 78 (high). 18% die before 50, and about 7% reach 100.
- the population stays within about 1% of its size.

---

## the user's preferences (from this session)

- writes in lowercase. ask before acting (files, memory, etc.). never run a dev server; the user runs it.
- **don't change visual styles that weren't asked about** (e.g. the debug places are red *squares*). keep their comments and structure; the code should be obvious, disciplined and smart. no quick fixes: understand the bigger picture first.
- movement must look **calm and free-flowing**. no jarring speed, and no everyone-moves-at-once moments.
- **noise is intended**: unlikely things (a busy 60-year-old) must be possible, just not likely.
- births on the road are fine. children not going out much is fine. travelling share as it is is fine.
- **an interpretation's "thought" is always the user's; never edit it.** when changing an interpretation, rewrite its "expression" (the technical implementation) so it describes exactly what the code does. make a new version file (e.g. 1.5 → 1.6) so the two can be compared, and leave the original alone.
- when testing or describing, say plainly what was and wasn't checked (e.g. headless node runs vs. a browser).

---

## open threads

- **dying before 50 (18%)** comes from the cubic death formula; left as the user's.
- **over-60s in short days** mostly stay home (low energy + short day).
- **sparse worlds** (few beings on a big canvas) move faster on screen, since speed follows place spacing.
- **newborns born away from home** take days to crawl home once they turn 2.
- some older interpretation header comments still leave out `max_mass` (the project readme is fixed, as are 1.6, 2.2 and 4.2).

- **4.x ripple cap:** at most 100 ripples, each living about 11–24s, limits how many meetings get a ripple (in both 4.1 and 4.2). faster fading or a higher cap would show more meetings, but it changes the look, so it's left for the user to decide.
- `3.0` inlines all of delaunator although `assets/scripts/delaunator.min.js` exists (only a cleanup; not done).

---

## interpretations (the "happy with" set)

| # | title | world params `(pop, day, max_mass)` | what's drawn |
|---|---|---|---|
| 1.5 | born in pairs | 200, 10 | red thread of fate. beings are paired at setup by greedy nearest-neighbour chaining (ties broken by age). only the **first 2 pairs** are drawn: bundles of red lines in HSL, where closer pairs get more, thicker and more saturated lines, with noise jitter. it accumulates (no background clear). |
| 2.0 | missed connections | 1000, 10, 4 | each being draws lines to neighbours within `3 * mass`. stroke weight goes from 1 to 0.1 with distance. the background is cleared every frame. |
| 3.0 | all the world's a mesh | 1000, 5 | a delaunay triangulation of all being positions every frame. triangles alternate fill (white, alpha = closeness) and stroke colour. it accumulates. |
| 4.1 | meetings are ripples | 500, 10, 30 | faint black lines between neighbours on a black background. "meetings" spawn jittered point-circle ripples (at most 100, deduplicated within 20px). a closer meeting gives a larger max radius. ripples grow 1px a frame and fade. |

### new versions (2nd october 2026), made after the system rework, to compare with the originals

each one keeps the user's thought unchanged and has a rewritten expression. all three are in `index.html` as commented-out lines under their originals.

- **1.6 born in pairs** (vs 1.5):
  - pairs are chained by **proximity and age**, weighed equally (`apartness` = distance / world diagonal + age gap / 100). 1.5 used age only to break exact ties, which never happen. the median age gap within a pair went from 16 to 3.
  - the thread **never breaks**: line count, stroke weight, saturation and lightness are clamped. in 1.5, pairs more than half the width apart drew nothing, because the line count went negative.
  - a thread **ends when one of the pair dies**. 1.5 kept drawing to the dead being's last spot.
- **2.2 missed connections** (vs 2.0):
  - lines are drawn only when **at least one of the two is travelling**, since the thought is about walking past people, and in the new system beings stay together at places. that's about 970 lines a frame vs about 2,300.
  - fixed an undeclared `neighbour` variable.
- **4.2 meetings are ripples** (vs 4.1):
  - a meeting is an **encounter**, from coming close (within 2× max mass) to parting, tracked per pair with ids held in a `WeakMap`.
  - each meeting sends **one** ripple at its **closest moment**: when they start drifting apart by more than 0.5px, or haven't got closer for 10 frames. its size still follows how close they came.
  - one chance only: if the cap is full, the meeting passes without a ripple. waiting for room would favour long meetings over passings.
  - in 4.1, crowds standing together set off ripples continuously. ripples with a moving being at their centre went from 37% to 46%.
  - `&` → `&&`.
- **3.0:** no new version; it already meets its thought.

how they were tested: headless node runs with p5 drawing calls stubbed out, counting lines and ripples and checking pairs. **they haven't been looked at in a browser by me.**

---

## where we left off (2nd october 2026)

- **done:**
  - the base simulation rework.
  - the analysis tool.
  - updates to the project `README.md`: the system paragraph (home, staying, energy, vigor, noise), the `World` signature with max mass, the world and being properties, and a pointer to the analysis tool.
  - the new interpretation versions 1.6, 2.2 and 4.2.
- **the user is comparing** the old and new interpretations in the browser. at last look, `index.html` had **3.0** active.
- **nothing is committed.** the changed and new files are `main/system/world.js`, `main/system/being.js`, `README.md`, `index.html`, `main/interpretations/{1.6,2.2,4.2}_*.js` and `assets/cde/` (these notes plus `analysis/`). `main/interpretations/.debug.js` was changed by the user (500, 5, 10, true).
- **next likely steps:**
  1. hear the user's verdict on 1.6, 2.2 and 4.2: keep, adjust, or promote to "happy with".
  2. decide the 4.x ripple cap and lifetime.
  3. the open threads above: death before 50, over-60s in short days, speed in sparse worlds, newborns crawling home.
  4. maybe new interpretations that use the new system's data (`state`, `place`, `home`, `busyness`, `place.crowd`, `world.clock`).
  5. commit when the user asks; `cde` is the current branch and `main` the main branch.
- **headless testing setup** (it lived in the session scratchpad, so it's gone; recreate it if needed):
  - load `world.js` and `being.js` in node with `vm.runInThisContext` (not a separate `vm` context: global lookups there are about 10× slower and skew timings).
  - stub p5: `createVector` with a small vector class (add, sub, mag, setMag, heading, copy, set, dist, div, mult, normalize, plus static sub, dist, add and mult), `constrain`, `random` (accepting an array or a range), `randomGaussian`, `shuffle`, `PI`, `sqrt`, `cos`, `sin`, `noStroke`, `p5.Vector`. drive `frameCount` yourself.
  - for interpretations, also stub the drawing calls (`line`, `point`, `stroke`, …) and `noise`, `dist`, `map`, `width`, `height`.

---

## how to run

open `index.html` (or `assets/cde/analysis/index.html`) through a local static server; the user runs it. change which interpretation loads by uncommenting its `<script>` tag. `save.js` (commented out) saves a jpeg on mouse press.
