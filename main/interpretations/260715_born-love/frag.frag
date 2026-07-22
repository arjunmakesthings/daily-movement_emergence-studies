#ifdef GL_ES
precision highp float;
precision highp int;
#endif

#define MAX_PAIRS 500

uniform vec2 u_start[MAX_PAIRS];
uniform vec2 u_end[MAX_PAIRS];
uniform int u_numPairs;

uniform vec2 u_resolution;

uniform float u_mass[MAX_PAIRS];

float distanceToSegment(vec2 p, vec2 a, vec2 b) {

    vec2 pa = p - a;
    vec2 ba = b - a;

    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);

    return length(pa - ba * h);
}

void main() {

    vec2 p = vec2(gl_FragCoord.x, u_resolution.y - gl_FragCoord.y);

    vec3 colour = vec3(1.0);

    for(int i = 0; i < MAX_PAIRS; i++) {

        if(i >= u_numPairs)
            break;

        vec2 a = u_start[i];
        vec2 b = u_end[i];

        float d = distanceToSegment(p, a, b);

        float pairDistance = distance(a, b);

        float thickness = mix(1.0, 0.05, pairDistance / length(u_resolution));

        float strength = smoothstep(thickness, 0.1, d);

        vec3 pairColour = vec3(d * 2.0);

        colour = mix(colour, pairColour, strength);

    }

    gl_FragColor = vec4(colour, 1.0);
}