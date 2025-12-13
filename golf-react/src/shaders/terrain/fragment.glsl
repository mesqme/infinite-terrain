// shaders/terrain/fragment.glsl
uniform vec3 uBaseColor;        // terrain color
uniform vec3 uFadeColor;        // background/edge color
uniform vec3 uCircleCenter;     // smoothed center for visual circle
uniform float uTrailPatchSize;  // chunk size (outerMax)
uniform float uCircleRadiusFactor; // scales uTrailPatchSize to circle radius
uniform float uGrassFadeOffset;
uniform float uGroundOffset;
uniform float uGroundFadeOffset;

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

  float outerRadius = uTrailPatchSize * uCircleRadiusFactor;
  float grassFadeWidth = uTrailPatchSize * uGrassFadeOffset;
  float groundOffsetWidth = uTrailPatchSize * uGroundOffset;
  float groundFadeWidth = uTrailPatchSize * uGroundFadeOffset;

  // Keep the band ordering stable even if the user dials offsets too large.
  float groundFadeOuter = max(outerRadius, 0.0);
  float groundSolidOuter = max(groundFadeOuter - groundFadeWidth, 0.0);
  float grassRadius = max(groundSolidOuter - groundOffsetWidth, 0.0);
  float innerGrassRadius = max(grassRadius - grassFadeWidth, 0.0);

  float t;
  if (groundFadeWidth <= 0.0) {
    t = step(groundSolidOuter, distToCircle);
  } else {
    t = smoothstep(groundSolidOuter, groundFadeOuter, distToCircle);
  }

  vec3 color = mix(uBaseColor, uFadeColor, t);

  gl_FragColor = vec4(color, 1.0);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
