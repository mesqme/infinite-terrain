// shaders/terrain/fragment.glsl
uniform vec3 uBaseColor;        // terrain color (from Leva or hardcoded)
uniform vec3 uFadeColor;        // usually white
uniform vec3 uCircleCenter;     // smoothed center for visual circle effect (lerps with camera)
uniform float uTrailPatchSize;  // same scale as grass / trail (e.g. CHUNK_SIZE)

// noise texture for irregular edge
uniform sampler2D uNoiseTexture;
uniform float uNoiseStrength;   // how much noise affects the edge (0-1)
uniform float uNoiseScale;      // scale of noise sampling
uniform float uCircleRadiusFactor; // multiplier for uTrailPatchSize to get circle radius

varying vec3 vWorldPosition;
varying vec2 vUv;

void main() {
  vec2 worldXZ = vWorldPosition.xz;
  vec2 circleXZ = uCircleCenter.xz;  // use smoothed circle center for visual effect

  float distToCircle = length(worldXZ - circleXZ);

  // If patch size is not set yet, don't fade at all: keep original green.
  if (uTrailPatchSize <= 0.0) {
    gl_FragColor = vec4(uBaseColor, 1.0);
    return;
  }

  // Use a "safe" patch size so tiny values don't explode the fade
  float safePatch = max(uTrailPatchSize, 0.0001);

  // Base inner radius ≈ where grass is, outer radius ≈ where it should be fully white
  float baseInnerRadius = safePatch * uCircleRadiusFactor;     // same as grass sphere radius
  
  // Sample noise texture based on world position to create irregular edge
  vec2 noiseUV = worldXZ * uNoiseScale * 0.01; // scale noise sampling
  float noiseValue = texture2D(uNoiseTexture, noiseUV).r; // sample Perlin noise (0-1)
  
  // Remap noise from 0-1 to -1 to 1, then apply strength
  float noiseOffset = (noiseValue - 0.5) * 2.0 * uNoiseStrength;
  
  // Apply noise offset to the radius to create irregular edge
  float innerRadius = baseInnerRadius * (1.0 + noiseOffset);
  float outerRadius = innerRadius * 1.2;   // slightly larger ring for terrain

  // 0 near circle center (pure base color), 1 far away (fade color)
  // Edge is now irregular due to noise
  float t = smoothstep(innerRadius, outerRadius, distToCircle);

  vec3 color = mix(uBaseColor, uFadeColor, t);

  gl_FragColor = vec4(color, 1.0);
}
