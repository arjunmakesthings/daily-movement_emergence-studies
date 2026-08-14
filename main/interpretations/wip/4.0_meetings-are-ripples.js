/*
interpretation #4.0: meetings are ripples.

thought: 
meeting people can be resounding. when two beings meet, a ripple is sent through in space & time; that may affect other beings. 

expression: 
connect beings close to each other with a white line. when two beings collide, create a ~circular ripple that expands from the point of collision. the strength of the ripple depends on how close the two beings were. lay this out over time.

parameters: 
population: 1000
day-length: 10

27th july, 2026.
*/

let world;
let ripples = [];

function setup() {
  createCanvas(1000, 1000);
  //accepts the following: (width, height, [population, day_length, max_mass, debug_mode])
  world = new World(width, height, 1000, 10, 30);
  world.initialize();

  background(255);

  noFill();
}

function draw() {
  world.run();

  // background(255);

  //show beings that intersect:
  for (let being of world.beings) {
    let neighbours = being.get_neighbours(world.max_mass * 2);

    if (neighbours.length > 0) {
      //if there are neighbours:

      for (let neighbour of neighbours) {
        //we operate only on one neighbour.
        const cp = p5.Vector.add(being.pos, neighbour.pos).div(2);

        const d = p5.Vector.dist(being.pos, neighbour.pos); //how far away are they. can only be more than max_mass.

        stroke(255, 20);
        strokeWeight(0.5);
        noFill();
        line(being.pos.x, being.pos.y, neighbour.pos.x, neighbour.pos.y);

        const exists = ripples.some((r) => dist(r.cx, r.cy, cp.x, cp.y) < 50);

        if (!exists) {
          ripples.push(new Ripple(cp.x, cp.y, d));
        }
        // ripples.push(new Ripple(cp.x, cp.y, d));
        break;
      }
    }
  }

  //update ripples.
  for (let i = ripples.length - 1; i >= 0; i--) {
    ripples[i].show();
    ripples[i].update();
    if (ripples[i].r > ripples[i].max_r) {
      ripples.splice(i, 1);
    }
  }
}

function show_being(p, m) {
  strokeWeight(1);
  stroke(255, 0, 0);

  circle(p.x, p.y, m);
}

const m_jit = 1;

class Ripple {
  constructor(cx, cy, str) {
    this.cx = cx;
    this.cy = cy;
    this.str = str;

    this.a = 100;

    this.r = 1;
    this.max_r = map(
      constrain(str, world.max_mass, world.max_mass * 4),
      world.max_mass,
      world.max_mass * 4,
      200,
      50,
    );
  }

  show() {
    strokeWeight(2);
    stroke(0, this.a);
    push();
    translate(this.cx, this.cy);

    for (let a = 0; a < TWO_PI; a += 0.01) {
      const x = cos(a) * this.r;
      const y = sin(a) * this.r;

      const jit = { x: random(-m_jit, m_jit), y: random(-m_jit, m_jit) };

      point(x + jit.x, y + jit.y);
    }
    pop();
  }

  update() {
    this.r += 1;
    this.a--;
  }
}

// class Ripple {
//   constructor(x, y) {
//     this.x = x;
//     this.y = y;
//     this.r = 0;
//     this.growth = 10;
//     this.radius = 0; // Starts at 0
//     this.growth = 2; // How many pixels it grows per frame
//     this.alpha = 255; // Start fully opaque
//     this.fade = 3; // How fast it fades out
//   }

//   update() {
//     this.radius += this.growth;
//     this.alpha -= this.fade;
//   }

//   display() {
//     noFill();
//     stroke(150, 200, 255, this.alpha); // Color changes with alpha
//     strokeWeight(2);

//     // Draw the ripple circle
//     ellipse(this.x, this.y, this.radius * 2);
//   }
// }

/*

  // background(255);

  if (ripples.length < 1) {
    for (let being of world.beings) {
      let neighbours = being.get_neighbours(3);

      if (neighbours.length < 1) {
        continue;
      } else {
        for (let neighbour of neighbours) {
          const cp = p5.Vector.add(being.pos, neighbour.pos).div(2);
          const d = p5.Vector.dist(being.pos, neighbour.pos);

          if (ripples.length < 1) {
            make_ripple(cp.x, cp.y, d);
          }

          show_beings(being.pos, neighbour.pos);
        }
      }
    }
  }

  for (let i = ripples.length - 1; i >= 0; i--) {
    ripples[i].display();
    ripples[i].update();

    if (ripples[i].a <= 0) {
      ripples.splice(i, 1);
    }
  }
    */
