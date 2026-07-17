/*
beings have a person that they belong with from birth.
*/

let world;

let c_shader;

let pairs = [];

function preload() {
  c_shader = loadShader(
    "/main/interpretations/260715_born-love/vert.vert",
    "/main/interpretations/260715_born-love/frag.frag",
  );
}

function setup() {
  createCanvas(1000, 1000, WEBGL);
  pixelDensity(1);

  world = new World(width, height, 500, 10);
  world.initialize();

  for (let i = 0; i < world.beings.length - 1; i++) {
    pairs.push([world.beings[i], world.beings[i + 1]]);
  }
}

function draw() {
  c_shader.setUniform("u_resolution", [width, height]);

  shader(c_shader);

    rect(0, 0, width, height);
}
