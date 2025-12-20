#ifdef GL_OES_standard_derivatives
#extension GL_OES_standard_derivatives : enable
#endif

uniform vec3 uBaseColor;        
uniform vec3 uCircleCenter;    
uniform float uTrailPatchSize;  
uniform float uCircleRadiusFactor;
uniform float uGrassFadeOffset;
uniform float uGroundOffset;
uniform float uGroundFadeOffset;
uniform sampler2D uNoiseTexture;
uniform float uNoiseStrength;
uniform float uNoiseScale;
uniform float uPixelSize;
uniform int uDitherMode;

// Varyings
varying vec3 vWorldPosition;
varying vec2 vUv;

// --- Dither Functions ---

// Reconstruct an approximated world position at the *big-pixel cell center*.
// This makes world-space masks (like the circle fade) snap to the same screen
// grid as the dithering, preventing big pixels from being "sliced" at the edge.
vec3 getWorldAtBigPixelCenter(vec3 worldPos, vec2 fragCoord, float pixelSize) {
    vec2 cellCenter = (floor(fragCoord / pixelSize) + 0.5) * pixelSize;
    vec2 delta = cellCenter - fragCoord; // in screen pixels
    return worldPos + dFdx(worldPos) * delta.x + dFdy(worldPos) * delta.y;
}

// 0. Diamond Dither
float getDiamondThreshold(vec2 fragCoord, float pixelSize) {
    vec2 uv = mod(fragCoord + 0.01, pixelSize);
    vec2 centered = (uv / pixelSize) * 2.0 - 1.0;
    float dist = abs(centered.x) + abs(centered.y);
    return dist / 2.0; 
}

// 1. Bayer Dither (8x8)
float getBayerThreshold(vec2 fragCoord, float pixelSize) {
    // Pixelate
    vec2 pixelCoord = floor(fragCoord / pixelSize);
    
    // 8x8 Bayer Matrix
    int x = int(mod(pixelCoord.x, 8.0));
    int y = int(mod(pixelCoord.y, 8.0));
    
    // 8x8 Bayer matrix values (0-63)
    int M[64];
    M[0]=0;  M[1]=32; M[2]=8;  M[3]=40; M[4]=2;  M[5]=34; M[6]=10; M[7]=42;
    M[8]=48; M[9]=16; M[10]=56;M[11]=24;M[12]=50;M[13]=18;M[14]=58;M[15]=26;
    M[16]=12;M[17]=44;M[18]=4; M[19]=36;M[20]=14;M[21]=46;M[22]=6; M[23]=38;
    M[24]=60;M[25]=28;M[26]=52;M[27]=20;M[28]=62;M[29]=30;M[30]=54;M[31]=22;
    M[32]=3; M[33]=35;M[34]=11;M[35]=43;M[36]=1; M[37]=33;M[38]=9; M[39]=41;
    M[40]=51;M[41]=19;M[42]=59;M[43]=27;M[44]=49;M[45]=17;M[46]=57;M[47]=25;
    M[48]=15;M[49]=47;M[50]=7; M[51]=39;M[52]=13;M[53]=45;M[54]=5; M[55]=37;
    M[56]=63;M[57]=31;M[58]=55;M[59]=23;M[60]=61;M[61]=29;M[62]=53;M[63]=21;
    
    int index = y * 8 + x;
    return float(M[index]) / 64.0;
}


// Check if pixel should be discarded
// mode 0: Diamond
// mode 1: Bayer
bool shouldDiscard(vec2 fragCoord, float pixelSize, float fadeLevel, int mode) {
    if (fadeLevel <= 0.0) return false;
    if (fadeLevel >= 1.0) return true;
    
    float threshold = 0.0;
    
    if (mode == 0) {
        // Diamond
        threshold = getDiamondThreshold(fragCoord, pixelSize + 4.0);
    } 
    else {
        // Bayer
        threshold = getBayerThreshold(fragCoord, pixelSize);
    }
    
    return threshold < fadeLevel;
}

void main() {
  vec3 worldCenterPos = getWorldAtBigPixelCenter(vWorldPosition, gl_FragCoord.xy, uPixelSize);
  vec2 worldXZ = worldCenterPos.xz;
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

  // Apply Dithering
  if (t > 0.0) {
      float fade = t;
      
      if (shouldDiscard(gl_FragCoord.xy, uPixelSize, fade, uDitherMode)) {
          discard;
      }
  }

  vec3 color = uBaseColor; // No mix, rely on dither

  gl_FragColor = vec4(color, 1.0);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
