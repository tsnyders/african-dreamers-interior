// GLSL for the flooring comparison plane.
//
// Kept out of the component so the shader can be read as shader source, and so
// the component file stays about lifecycle rather than about lighting.
//
// UV convention: v = 0 is the near edge of the floor (bottom of the canvas,
// closest to the viewer), v = 1 is the far edge where the floor meets the
// room photograph behind it.

export const FLOOR_VERTEX = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

export const FLOOR_FRAGMENT = /* glsl */ `
  precision highp float;

  uniform sampler2D uTex0;
  uniform sampler2D uTex1;
  uniform sampler2D uTex2;
  uniform float uProgress;
  uniform float uAspect;
  uniform vec2 uRepeat;
  uniform float uDepth;

  varying vec2 vUv;

  // Colour space: this plane is a flat composite of two photographs, not a lit
  // scene, so everything stays in display space. Textures are left untagged so
  // Three does not decode them to linear, the falloff and sheen below are a
  // straight display-space modulation, and nothing is encoded on the way out.
  // Tagging them sRGB instead costs a decode with no matching encode — a fully
  // custom fragment shader gets none of Three's output conversion appended —
  // and the whole plane lands about a gamma too dark.

  // Perspective foreshortening: the plane is read at a grazing angle, so planks
  // compress toward the far edge instead of tiling flat like a swatch.
  vec2 floorUv(vec2 uv) {
    float depth = mix(1.0, uDepth, uv.y);
    vec2 p = vec2((uv.x - 0.5) / depth + 0.5, uv.y / depth);
    return p * uRepeat;
  }

  void main() {
    vec2 uv = floorUv(vUv);

    // uProgress walks two transitions: the first half is oak into walnut, the
    // second walnut into micro-cement.
    float p = clamp(uProgress, 0.0, 1.0) * 2.0;
    float stage = floor(min(p, 1.999));
    float t = clamp(p - stage, 0.0, 1.0);
    float s = step(0.5, stage);

    // Branch-free material selection — three fetches either way, and no
    // driver-dependent behaviour from sampling inside a conditional.
    vec3 t0 = texture2D(uTex0, uv).rgb;
    vec3 t1 = texture2D(uTex1, uv).rgb;
    vec3 t2 = texture2D(uTex2, uv).rgb;
    vec3 older = mix(t0, t1, s);
    vec3 newer = mix(t1, t2, s);

    // Soft-edged vertical divider sweeping left to right. Everything behind it
    // has already changed material.
    float feather = 0.006 * uAspect;
    float edge = smoothstep(t - feather, t + feather, vUv.x);
    vec3 color = mix(newer, older, edge);

    // The divider drawn as a hairline rather than a hard seam, and only while
    // it is actually crossing the floor.
    float live = step(0.004, t) * step(t, 0.996);
    float rule = smoothstep(0.0045, 0.0, abs(vUv.x - t));
    color = mix(color, vec3(1.0), rule * 0.5 * live);

    // Ambient room light: one soft falloff toward the far edge plus a grazing
    // sheen band. Identical for every material, which is the whole point of
    // comparing them in the same room.
    float falloff = mix(1.04, 0.84, smoothstep(0.0, 1.0, vUv.y));
    float sheen = smoothstep(0.42, 0.0, abs(vUv.y - 0.62)) * 0.08;
    color = color * falloff + sheen;

    // Fade the far edge so the plane meets the photograph instead of ending on
    // a cut line.
    float blend = 1.0 - smoothstep(0.82, 1.0, vUv.y);

    gl_FragColor = vec4(color, blend);
  }
`;
