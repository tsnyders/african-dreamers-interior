// GLSL for the flooring comparison.
//
// This is a composite, not an overlay. The plane covers the whole photograph,
// but only paints where the room's floor actually is: fragments above the
// wall/floor junction are discarded, so the walls, window and garden stay the
// original picture, untouched.
//
// Which pixels are floor comes from a matte built off the plate, not from a
// line: furniture stands in front of the wall, so any straight junction paints
// over its base and still misses the floor along the glazing.
//
// Inside the floor, each fragment is mapped through the inverse of a homography
// (`uInvFloor`) taking a unit square onto a floor rectangle measured in the
// plate. That is what makes the planks recede along the room's own perspective
// instead of sitting flat on top of it.
//
// Lighting comes from the photograph. The new material is multiplied by the
// original floor's luminance, so the window light, the wall bounce and the
// contact shadows under the furniture all survive the swap — which is what
// makes a retouched floor look like it belongs in the room.
//
// Coordinate convention: `s` is screen space with (0,0) at the TOP left,
// matching how the floor geometry is measured in lib/site.ts.

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
  uniform sampler2D uRoom;
  uniform sampler2D uFloorMask;

  uniform float uProgress;
  uniform vec2 uRepeat;

  // Inverse homography: screen -> floor. Built on the CPU from the measured
  // quad, already folded through the plate's object-fit: cover transform.
  uniform mat3 uInvFloor;

  // Where to sample the untouched plate, and the mean luminance of its floor so
  // the transferred lighting is centred on 1.0.
  uniform vec2 uPlateOffset;
  uniform vec2 uPlateScale;
  uniform float uLightRef;

  varying vec2 vUv;

  void main() {
    vec2 s = vec2(vUv.x, 1.0 - vUv.y);

    // The matte says which pixels are floor. Anything else — wall, sofa, side
    // table, door track, glazing, garden — is left as the original photograph.
    vec2 plateUv = clamp((s - uPlateOffset) / uPlateScale, 0.0, 1.0);
    float floorMask = texture2D(uFloorMask, plateUv).r;
    if (floorMask < 0.04) discard;

    vec3 q = uInvFloor * vec3(s, 1.0);
    if (abs(q.z) < 1e-6) discard;
    vec2 st = q.xy / q.z;

    vec2 uv = st * uRepeat;

    // uProgress walks two transitions: the first half is oak into walnut, the
    // second walnut into micro-cement. Branch-free selection — three fetches
    // either way, and no driver-dependent behaviour from sampling inside a
    // conditional.
    float p = clamp(uProgress, 0.0, 1.0) * 2.0;
    float stage = floor(min(p, 1.999));
    float t = clamp(p - stage, 0.0, 1.0);
    float sel = step(0.5, stage);

    vec3 t0 = texture2D(uTex0, uv).rgb;
    vec3 t1 = texture2D(uTex1, uv).rgb;
    vec3 t2 = texture2D(uTex2, uv).rgb;
    vec3 older = mix(t0, t1, sel);
    vec3 newer = mix(t1, t2, sel);

    // The divider stays a true vertical in screen space. Following the floor's
    // perspective would be more "correct" and much harder to read as a
    // comparison.
    float edge = smoothstep(t - 0.004, t + 0.004, s.x);
    vec3 color = mix(newer, older, edge);

    // Relight from the plate. Clamped so a blown highlight or a deep shadow
    // cannot drive the new material to pure white or black.
    vec3 room = texture2D(uRoom, plateUv).rgb;
    float lum = dot(room, vec3(0.2126, 0.7152, 0.0722));
    // Eased back off full strength: at 1.0 a dark material in the shadowed
    // corner loses its grain entirely, which reads as a hole in the floor
    // rather than as shade.
    float relight = mix(1.0, lum / max(uLightRef, 0.001), 0.85);
    color *= clamp(relight, 0.58, 1.32);

    // The divider drawn as a hairline, and only while it is crossing the floor.
    float live = step(0.004, t) * step(t, 0.996);
    color = mix(color, vec3(1.0), smoothstep(0.0035, 0.0, abs(s.x - t)) * 0.5 * live);

    // The matte is feathered a pixel, so it doubles as the alpha and the new
    // floor meets the skirting without aliasing.
    gl_FragColor = vec4(color, smoothstep(0.04, 0.55, floorMask));
  }
`;
