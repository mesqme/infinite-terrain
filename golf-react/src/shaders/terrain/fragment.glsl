uniform vec3 uBaseColor;        
uniform vec3 uFadeColor;        
uniform vec3 uCircleCenter;    
uniform float uTrailPatchSize;  
uniform float uCircleRadiusFactor;
uniform float uGrassFadeOffset;
uniform float uGroundOffset;
uniform float uGroundFadeOffset;

// Varyings
varying vec3 vWorldPosition;
varying vec2 vUv;

void main() {
  vec2 worldXZ = vWorldPosition.xz;
  vec2 circleXZ = uCircleCenter.xz;

  float distToCircle = length(worldXZ - circleXZ);

  float innerGrassRadius = uTrailPatchSize * uCircleRadiusFactor;
  float outerGrassRadius = innerGrassRadius + uGrassFadeOffset;
  float groundRadius = outerGrassRadius + uGroundOffset;
  float groundFadeRadius = groundRadius + uGroundFadeOffset;

  float t = smoothstep(groundRadius, groundFadeRadius, distToCircle);

  vec3 color = mix(uBaseColor, uFadeColor, t);

  gl_FragColor = vec4(color, 1.0);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
