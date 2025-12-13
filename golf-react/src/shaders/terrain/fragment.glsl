// shaders/terrain/fragment.glsl
uniform vec3 uBaseColor;        // terrain color
uniform vec3 uFadeColor;        // background/edge color
uniform vec3 uCircleCenter;     // smoothed center for visual circle
uniform float uTrailPatchSize;  // chunk size (outerMax)
uniform float uCircleRadiusFactor; // scales uTrailPatchSize to circle radius

varying vec3 vWorldPosition;
varying vec2 vUv;

void main() {
  vec2 worldXZ = vWorldPosition.xz;
  vec2 circleXZ = uCircleCenter.xz;

  float distToCircle = length(worldXZ - circleXZ);

  if (uTrailPatchSize <= 0.0) {
    gl_FragColor = vec4(uBaseColor, 1.0);
    return;
  }

  // Main radius control: `grassRadius` is the OUTER edge where grass reaches 0.
  // Ground extends beyond it with fixed offsets (based on chunk size).
  float grassRadius = uTrailPatchSize * uCircleRadiusFactor;
  float groundOffsetWidth = uTrailPatchSize * 0.005;
  float groundFadeWidth = uTrailPatchSize * 0.025;

  float groundSolidOuter = grassRadius + groundOffsetWidth;
  float groundFadeOuter = groundSolidOuter + groundFadeWidth;

  // 0 inside solid ground, 1 at/after fade end
  float t = smoothstep(groundSolidOuter, groundFadeOuter, distToCircle);

  vec3 color = mix(uBaseColor, uFadeColor, t);

  gl_FragColor = vec4(color, 1.0);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
