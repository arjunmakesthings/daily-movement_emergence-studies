# cde: project context

my working notes on `daily-movement_emergence-studies`. the sources are the project readme and the code as of commit `92035c4` on branch `cde`.

---

## what it is

- an art and software project about emergence. it takes its inspiration from casey reas' *process compendium*.
- its rules come from everyday life, not from abstract cellular rules like conway's game of life. beings are born, age, follow daily schedules, move between places, reproduce and die.
- the artist never shows the simulation itself. what you see is a **software-interpretation**: an english "thought" made real as an algorithm that picks out data from the system and draws it.
- every interpretation has a header comment with **thought**, **expression**, **parameters** and a date.
- it's built with p5.js in global mode, using plain `<script>` tags with no build step. `index.html` loads the system files plus exactly one interpretation, and you switch between them by commenting tags in and out.

---

## layout

```
index.html                     # loads p5, system, and one interpretation (currently .debug.js)
assets/scripts/                # p5.min.js, delaunator.min.js, save.js (all gitignored)
main/system/world.js           # World class
main/system/being.js           # Being class
main/interpretations/          # finished ("happy with") interpretations
  .debug.js                    # debug-mode world, no interpretation drawing
  .template.js                 # starter for new interpretations
  .ideas.txt                   # idea list
  1.5_born-in-pairs.js
  2.0_missed-connections.js
  3.0_all-the-world's-a-mesh.js   # inlines its own copy of delaunator
  4.1_meetings-are-ripples.js
  wip/                         # earlier/alternate versions (1.1, 1.3, 1.4, 2.1, 4.0)
trials/                        # scratch experiments (curve tests, discarded functions, shader attempts)
paper/                         # 260806_software-study.pdf + references (wolfram, bar-yam, reas links)
```

branches: `main`, `interpretations`, `cde` (the current one).

---

## the system

### `World` (`main/system/world.js`)

`new World(w, h, init_population = 4, day_length = 24, max_mass = 10, debug_mode = false)`

> note: the project readme lists the signature as `(w, h, [n, d, db])` and leaves out `max_mass`. the actual order is **population, day_length, max_mass, debug_mode**, which is what `.template.js` documents.

- **time:** `keep_time()` sets `time = floor(frameCount / 60) % day_length`. one world-hour is 60 frames, about 1s at 60fps. one day is `day_length` hours.
- **hotspots ("places"):** `max(2, floor(pop/4))` points laid out on a golden-angle (sunflower) spiral inside `0.45 * min(w,h)` around the centre. beings only ever travel between hotspots. an older concentric-circle version is still in the file, commented out.
- **initialize():** spawns `init_population` beings at random positions with a 5% margin. ages come from `gaussian(18, 20)` clamped to 18–60.
- **run(), each frame:**
  1. in debug mode, draws a white background.
  2. `keep_time()`.
  3. `being.exist()` for every being.
  4. if there are more than 2 beings: `prevent_collisions()`, then `kill_and_make_beings()`.
  5. in debug mode, `show_debugs()` draws hotspots as red squares, labels `beings[0]` and logs its state to the console every frame.
- **death and birth (`kill_and_make_beings`):**
  - a random `killing_time` hour is picked at hour 0 of each day.
  - at that hour, if the population is above 95% of the initial count, each being dies with p = `0.0002 + 0.12 * (age/100)^3`.
  - on any other frame, if the population is below the initial count, beings aged 18–45 call `reproduce()` until the population is back up.
  - result: the population stays close to `init_population`, a homeostasis.
- **prevent_collisions():** a spatial hash with cell size `3 * max_mass`, 2 passes and a 0.5 slop. overlapping pairs get pushed apart symmetrically.

### `Being` (`main/system/being.js`)

constructed as `new Being(x, y, age)`. it reads the global `world`.

- **"genetics"** are random, not inherited:
  - `maxes.max_mass` = `gaussian(10, 6)` clamped to `[5, world.max_mass]`.
  - `maxes.max_mass_age` is about 18.
  - `maxes.speed_mult` is between 0.2 and 0.8.
- **mass(age):** asymptotic exponential growth, `a(1 - e^(-5·age/b)) / (1 - e^(-5))`, rising towards `max_mass` by about age 18. it's used as the drawn diameter and the collision size.
- **energy(age):** two logistic curves multiplied together. it rises around 18, falls after about 35, and peaks at about 10.
- **speed** = `energy / mass`, so young adults move fastest and children and the elderly barely move.
- **schedule(age):** busyness is a gaussian peaking at age 25 (2 to 12 slots). the schedule is a chained list of `[start_hour, end_hour]` pairs taken from the day's hours and closed into a loop. each slot gets a random hotspot as its destination.
- **move():** once a being reaches its destination (`dist < mass`), it looks for a schedule slot whose start hour equals `world.time` and heads for that slot's destination. movement is straight-line at `speed`, with no overshoot, clamped to the canvas.
- **aging (`get_curr_age`):** +1 age every `60 * day_length` frames, i.e. one year per world-day. mass and energy are recomputed. the schedule is regenerated: always for ages 2–5, with a 50% chance for ages 7–59, and a 25% chance for ages over 60.
- **reproduce():** needs at least one neighbour within `2 * max_mass`. the chance is a logistic window over ages 18–40, scaled by 0.2. the newborn (age 0) appears at the midpoint between the two parents.
- **get_neighbours(radius = 2 * world.max_mass, beings = world.beings):** a brute-force radius filter, O(n) per call. interpretations that call it for every being end up O(n²).
- **show():** debug only. draws a circle (grey shade from age) and an arrow toward the destination.

---

## interpretations (the "happy with" set)

| # | title | world params `(pop, day, max_mass)` | what's drawn |
|---|---|---|---|
| 1.5 | born in pairs | 200, 10 | red thread of fate. beings are paired at setup by greedy nearest-neighbour chaining (ties broken by age). only the **first 2 pairs** are drawn: bundles of red lines in HSL, where closer pairs get more, thicker and more saturated lines, with noise jitter. it accumulates (no background clear). |
| 2.0 | missed connections | 1000, 10, 4 | each being draws lines to neighbours within `3 * mass`. stroke weight goes from 1 to 0.1 with distance. the background is cleared every frame. |
| 3.0 | all the world's a mesh | 1000, 5 | a delaunay triangulation of all being positions every frame (delaunator is inlined). triangles alternate fill (white, alpha = closeness) and stroke colour. it accumulates. |
| 4.1 | meetings are ripples | 500, 10, 30 | faint black lines between neighbours on a black background. "meetings" spawn jittered point-circle ripples (at most 100, deduplicated within 20px). a closer meeting gives a larger max radius. ripples grow 1px a frame and fade. |

the `wip/` folder holds earlier iterations: 1.1, 1.3 and 1.4 of born-in-pairs, 2.1 of missed-connections (black background, connections wiped by movement), and 4.0 of ripples.

---

## things i noticed (possible bugs / quirks)

- `being.js` `move()`: `speed * this.speed_mult;` is a no-op statement, and `this.speed_mult` is undefined anyway because it lives in `this.maxes.speed_mult`. speed_mult currently has **no effect**.
- `being.js` `get_curr_age()`: ages exactly 6 and exactly 60 fall through every branch and never regenerate their schedule (`< 6`, `> 6`, `< 60`, `> 60`).
- `being.js` `get_schedule()`: once `avl_time` runs low, `splice` can return `undefined` for `a` or `b`. the `while (i < busyness)` loop also depends on `i` (an index) rather than `schedule.length`, so the number of slots is loosely tied to busyness at best, and the loop could stall in theory.
- `being.js` `move()` only picks a new destination when the start hour matches `world.time` **exactly** while the being is already at its destination. a being that arrives late skips that slot.
- `world.js` timing assumes 60fps. at a lower framerate the simulation slows down rather than skipping ahead.
- `world.js` `show_debugs()` logs to the console every frame, which is heavy.
- `kill_and_make_beings()` only runs when the population is above 2.
- the project readme's `World` signature is out of date (it's missing `max_mass`).
- several interpretation comments still say `(width, height, [population, day_length, debug_mode])`, also missing `max_mass`.
- in `4.1`, `!exists & ripples.length < 100` uses bitwise `&`. it works by coincidence of precedence, but `&&` was the intent.
- `1.5` only draws `pairs[0..1]` and never updates pairs when beings die, so a pair can point at dead beings, which freeze in place.
- `3.0` inlines all of delaunator even though `assets/scripts/delaunator.min.js` exists and isn't loaded in `index.html`.

---

## how to run

open `index.html` through a local static server (the user runs this themselves). change which interpretation loads by uncommenting its `<script>` tag. `.debug.js` is the one loaded right now. `save.js` (commented out) saves a jpeg on mouse press.
