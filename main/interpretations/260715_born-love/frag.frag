precision mediump float;

uniform vec2 u_resolution;

void main() {

    vec2 p = gl_FragCoord.xy;

    gl_FragColor = vec4(vec2(p), 0.0, 1.0);
}