#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution; 

void main() {
    vec2 p = gl_FragCoord.xy / u_resolution.xy;

    //flip:
    p.y = 1.0 - p.y; 

    gl_FragColor = vec4(p.x, p.y, 0.0, 1.0);
}