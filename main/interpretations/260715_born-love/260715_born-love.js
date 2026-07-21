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

  console.log(buffer);

  shader(c_shader);

  rect(0, 0, width, height);
}

/*
pass data as a buffer: 

**The "Buffer" Version:**
// A flat array of just positions [x,y, x,y, x,y...]
let buffer = new Float32Array(beings.length * 2);
for (let i = 0; i < beings.length; i++) {
  buffer[i * 2] = beings[i].x;
  buffer[i * 2 + 1] = beings[i].y;
}
2. The Vertex Shader (`vert.glsl`)
In the vertex shader, we don't "loop" through a list. Instead, the GPU runs this code **once for every point** in your buffer
simultaneously. We use an attribute to grab the position from the buffer.

  // Standard attributes (provided by p5/WebGL)
  attribute vec3 a_position;

  // Our custom attribute from the buffer
  attribute vec2 a_custom_pos;

  varying vec2 v_tex_coords; // Pass info to fragment shader if needed

  void main() {
      // We use our buffered position instead of the standard one
      // Note: p5.js usually maps 'a_position' to your coordinates
      vec3 newPosition = vec3(a_custom_pos, 1.0);

      gl_Position = vec4(newPosition, 1.0);

      // This makes the points large enough to see!
      gl_PointSize = 10.0;
  }

---

3. The Fragment Shader (`frag.glsl`)
The fragment shader decides what color each pixel of those points should be. Since you want to color them, we can pass a
"color" attribute or calculate it based on logic.

  precision mediump float;

  // If you want unique colors, you'd add an attribute here:
  // attribute vec3 a_color;
  // varying vec3 v_color;

  void main() {
      // Standard circle mask (makes the points round instead of square)
      float dist = distance(gl_PointCoord, vec2(0.5));
      if (dist > 0.5) discard;

      // Just a simple color for now
      gl_FragColor = vec4(0.0, 0.8, 1.0, 1.0);
  }

---

How to implement this in p5.js
Since you are using p5, the simplest way to "implement the buffer" without writing raw WebGL is to use a **Float32Array** and
pass it through your shader logic.

However, there is a catch: Standard p5 shader() calls don't always automatically map custom attributes perfectly unless you
use specific techniques.

**The Practical Path for your "Beings" project:**
If you have under 10,000 beings, the most common way to do this in p5 while still using shaders is:

1.  **Create a Vertex Array**: Create a Float32Array that holds only the $x$ and $y$ coordinates of every being.
2.  **The Loop**: Use a standard for loop in your draw() function to iterate through your beings, but instead of calling
point() or ellipse(), you update the values in your Float32Array.
3.  **Shader Application**: Tell the shader where the "beings" are by


*/