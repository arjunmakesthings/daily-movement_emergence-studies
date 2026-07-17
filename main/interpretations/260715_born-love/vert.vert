#ifdef GL_ES
precision mediump float;
#endif

//from p5:
attribute vec3 aPosition;
uniform mat4 uProjectionMatrix;
uniform mat4 uModelViewMatrix; 

//passed: 
uniform vec2 u_resolution;

void main() {
    vec4 position = vec4(aPosition, 1.0); 

    //translate: 
    position.xy -= 0.5;

    gl_Position = uProjectionMatrix * uModelViewMatrix * position;
}