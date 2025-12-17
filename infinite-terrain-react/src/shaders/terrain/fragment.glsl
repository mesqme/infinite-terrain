uniform vec3 uBaseColor;        
uniform vec3 uFadeColor;        
uniform vec3 uCircleCenter;    
uniform float uTrailPatchSize;  
uniform float uCircleRadiusFactor;
uniform float uGrassFadeOffset;
uniform float uGroundOffset;
uniform float uGroundFadeOffset;
uniform sampler2D uNoiseTexture;
uniform float uNoiseStrength;
uniform float uNoiseScale;

// Varyings
varying vec3 vWorldPosition;
varying vec2 vUv;

void main() {
  vec2 worldXZ = vWorldPosition.xz;
  vec2 circleXZ = uCircleCenter.xz;

  float distToCircle = length(worldXZ - circleXZ);

  // Sample noise texture at world position
  vec2 noiseUV = worldXZ * uNoiseScale * 0.1;
  float noiseValue = texture2D(uNoiseTexture, noiseUV).r;
  
  // Remap noise from [0, 1] to [-1, 1] and apply strength
  float noiseOffset = (noiseValue * 2.0 - 1.0) * uNoiseStrength;
  
  // Apply noise to the inner grass radius
  float innerGrassRadius = uTrailPatchSize * uCircleRadiusFactor * (1.0 + noiseOffset);
  float groundRadius = innerGrassRadius + uGroundOffset;
  float groundFadeRadius = groundRadius + uGroundFadeOffset;

  float t = smoothstep(groundRadius, groundFadeRadius, distToCircle);

  vec3 color = mix(uBaseColor, uFadeColor, t);

  gl_FragColor = vec4(color, 1.0);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
