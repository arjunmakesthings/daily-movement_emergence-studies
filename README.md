### what:
inspired by [process-compendium](https://github.com/REAS/studio/blob/master/ProcessCompendium.md) made by casey reas, this is a software-project written to explore emergence. however, unlike other enquiries pursuing emergence in complex systems (such as [conway's game of life](https://en.wikipedia.org/wiki/Conway's_Game_of_Life)), the rules here are inspired by the motions (and physical constraints) of everyday life in new-york.

this is *not* a representative system, but merely inspired by a tiny part of the multitude i / we live in.

---

### system:

there is a <mark>world</mark>. the world is a container, and consists of many <mark>places</mark>.

the world contains a <mark>population</mark> of <mark>beings</mark> — who are born, sustained, and killed over <mark>time</mark> by the world.

the beings express life through <mark>movement</mark>, and movement is governed by a <mark>schedule</mark>. both the schedule & movement are governed by age (for eg: the closer you are to your 20s, the more likely you are to have a busier schedule (and thereby move more)). 

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
    * `world = new World(w, h, [n, d, db]);` with the following parameters: 
        * w: (int) width of the world. 
        * h: (int) height of the world.
        * n: (int) initial population (default: 4).
        * d: (int) day-length (default: 24) -> can be accessed via `world.day_length`. 
        * db: (bool) debug-mode (default: false).

- initialize the world with `world.initialize()`. 

- run the world with `world.run()`. 

- `world.beings` gives you a list of all beings in that world, with the following properties: 
    - `.age` => int
    - `.pos` => p5.Vector
    - `mass` => float
    - `energy` => float

- beings are also capable of getting their neighbours with `.get_neighbours ([radius = world.max_mass * 2, beings = world.beings])` => returns an array of beings.

---
