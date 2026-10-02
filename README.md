### what:
inspired by [process-compendium](https://github.com/REAS/studio/blob/master/ProcessCompendium.md) made by casey reas, this is a software-project written to explore emergence. however, unlike other enquiries pursuing emergence in complex systems (such as [conway's game of life](https://en.wikipedia.org/wiki/Conway's_Game_of_Life)), the rules here are inspired by the motions (and physical constraints) of everyday life.

this is *not* a representative system, but merely inspired by a tiny part of the multitude i / we live in.

---

### system:

there is a <mark>world</mark>. the world is a container, and consists of many <mark>places</mark>.

the world contains a <mark>population</mark> of <mark>beings</mark> — who are born, sustained, and killed over <mark>time</mark> by the world.

the beings express life through <mark>movement</mark>, and movement is governed by a <mark>schedule</mark>. each being has a <mark>home</mark>; its day starts & ends there, and in between, it travels to a few (mostly nearby) places, and <mark>stays</mark> at each for a while — like we do. both the schedule & movement are governed by age (for eg: the closer you are to your 20s, the more likely you are to have a busier schedule (and thereby have to move more)).

age also shapes a being's <mark>energy</mark> (it rises through childhood, peaks in the 20s & 30s, and declines with age), and energy is how fast a being moves — so, how much of its schedule a day allows. some beings simply have more <mark>vigor</mark> than others: more energy, and longer lives. nothing is exact; there is noise everywhere — so a 60 year old may well be busier than a 23 year old. it is just not likely. 

what is, however, shown to a person is <strong>not</strong> a representation of the system, but <mark>software-interpretations</mark> of it — the artist (myself) decides what to show from the simulation. 

---

### software-interpretations:
software-interpretations are always written in english, and then realized by a constructed algorithm. each interpretation has the following sections: 
- thought: the core idea to express from the system. 
- expression: technical details on extracting & representing relevant data from the system. 
- parameters: some software-interpretations may be computationally heavier than others. so, we may modify parameters of the system to realize them.

---

### technical notes: 
this system is built using [p5.js](https://p5js.org/), a javascript library for programmatic-art. 

system files live in `./main/system` & interpretations live in `./main/interpretations`, all as `.js` files. interpretations are served to a person via an `index.html` file.

an interpretation can be written by doing the following: 

- instantiate a world:
    * `world = new World(w, h, [n, d, m, db]);` with the following parameters: 
        * w: (int) width of the world. 
        * h: (int) height of the world.
        * n: (int) initial population (default: 4).
        * d: (int) day-length, in hours (default: 24) -> can be accessed via `world.day_length`. an hour is 60 frames.
        * m: (int) max-mass, i.e. the largest a being can be drawn (default: 10) -> can be accessed via `world.max_mass`. it only changes size, not speed.
        * db: (bool) debug-mode (default: false).

- initialize the world with `world.initialize()`. 

- run the world with `world.run()`. 

- the world keeps time: `world.time` => the hour of the day (int); `world.clock` => the time of day, in hours (float).

- `world.places` gives you a list of all places in the world, each with `.pos` (p5.Vector) & `.crowd` (int: how many beings are staying there).

- `world.beings` gives you a list of all beings in that world, with the following properties: 
    - `.age` => int
    - `.pos` => p5.Vector
    - `.mass` => float
    - `.energy` => float
    - `.state` => `"travelling"` or `"staying"`
    - `.place` => the place it's travelling to, or staying at
    - `.home` => its home (a place)
    - `.busyness` => int: how many places it wishes to be at in a day (incl. home)
    - `.get_speed()` => float: pixels per frame

- beings are also capable of getting their neighbours with `.get_neighbours ([radius = world.max_mass * 2, beings = world.beings])` => returns an array of beings.

- to see how age, energy, speed, busyness & death relate (as graphs & checks), open `./assets/cde/analysis/index.html`.

---
