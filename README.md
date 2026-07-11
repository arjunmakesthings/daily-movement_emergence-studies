### what:
inspired by [process-compendium](https://github.com/REAS/studio/blob/master/ProcessCompendium.md) by casey reas, this is a software-project written to explore emergence. however, unlike other enquiries pursuing emergence in complex systems (such as [conway's game of life](https://en.wikipedia.org/wiki/Conway's_Game_of_Life)), the rules here are inspired by the motions (and physical constraints) of everyday life.

this is *not* a representative system, but merely inspired by a tiny part of the multitude we live in.

---

### system:

there is a <mark>world</mark>. the world is a container, and consists of many <mark>places</mark>.

the world contains a <mark>population</mark> of <mark>beings</mark> — who are born, sustained, and killed over <mark>time</mark> by the world.

the beings express life through <mark>movement</mark>, and movement is governed by a <mark>schedule</mark>.

what is, however, shown to a person is <strong>not</strong> this autonomous system, but <mark>software-interpretations</mark> of it — i.e: the artist (often myself) decides what to show from the simulation.

---

### technical notes: 
this system is built using [p5.js](https://p5js.org/), a javascript library for programmatic-art. 

the simulation lives in `./main/simulation`, and interpretations live in `./main/interpretations`.

an interpretation can be written by doing the following: 

- instantiate a world:
    * `world = new World(w, h, [n, d, db]);` with the following parameters: 
        * w: (int) width of the world. 
        * h: (int) height of the world.
        * n: (int) initial population (default: 4).
        * d: (int) day-length (default: 24).
        * db: (bool) debug-mode (default: false).

- initialize the world with `world.initialize()`. 

- run the world with `world.run()`. 

