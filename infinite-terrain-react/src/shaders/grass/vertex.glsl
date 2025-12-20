uniform float uTime;

// Blade parameters
uniform float uGrassSegments;
uniform float uGrassChunkSize;
uniform float uGrassWidth;
uniform float uGrassHeight;
uniform float uLeanFactor;
uniform vec3 uGrassBaseColor;
uniform vec3 uGrassTopColor;

// Wind parameters
uniform float uWindScale;
uniform float uWindStrength;
uniform float uWindSpeed;

// Trail parameters
uniform sampler2D uTrailTexture;
uniform vec3 uBallPosition;      
uniform vec3 uCircleCenter;      // smoothed center for visual circle effect (lerps with camera)
uniform float uTrailCanvasSize;  // texture resolution (e.g. 256)
uniform float uSobelMode;        // 0.0 = 4-tap, 1.0 = 8-tap Sobel

// Border parameters
uniform sampler2D uNoiseTexture;
uniform float uNoiseStrength;    
uniform float uNoiseScale;       
uniform float uCircleRadiusFactor; 
uniform float uGrassFadeOffset;

// Attributes
attribute vec3 aInstancePosition; // per-blade base position in chunk space

// Varyings
varying vec3 vColor;
varying vec4 vGrassData;         // x: local x, y: heightPercent, z: side, w: unused
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vTrailValue;       // trail intensity used in fragment for color tweak

#include includes.glsl

void main() {
  int GRASS_SEGMENTS = int(uGrassSegments);
  int GRASS_VERTICES = (GRASS_SEGMENTS + 1) * 2;
  float GRASS_PATCH_SIZE = uGrassChunkSize * 0.5;
  float GRASS_WIDTH = uGrassWidth;
  float GRASS_HEIGHT = uGrassHeight;
  float grassHeight = 1.0;
  float grassMinHeight = 0.25;
  
  // world space position of the blade
  vec3 grassOffset = aInstancePosition;
  vec3 grassBladeWorldPos = (modelMatrix * vec4(grassOffset, 1.0)).xyz;
  vec2 worldXZ = grassBladeWorldPos.xz;  
  vec3 hashVal = hash(grassBladeWorldPos); // hash value for the blade
  
  // blade distance from center
  vec2 circleXZ = uCircleCenter.xz;
  vec2 deltaXZCircle = worldXZ - circleXZ;
  float distToCircle = length(deltaXZCircle);
  
  // Sample noise texture at world position
  vec2 noiseUV = worldXZ * uNoiseScale * 0.1;
  float noiseValue = texture2D(uNoiseTexture, noiseUV).r;
  
  // Remap noise from [0, 1] to [-1, 1] and apply strength
  float noiseOffset = (noiseValue * 2.0 - 1.0) * uNoiseStrength;
  
  // grass circle border with noise applied
  float grassRadius = uGrassChunkSize * uCircleRadiusFactor * (1.0 + noiseOffset);
  float grassMask = 1.0 - smoothstep(grassRadius - uGrassFadeOffset, grassRadius, distToCircle);
  grassHeight *= grassMask;

  // blade distance to ball
  vec2 ballXZ  = uBallPosition.xz;
  vec2 deltaXZ = worldXZ - ballXZ;
  float distToBall = length(deltaXZ);
  float radiusFade = 1.0 - smoothstep(grassRadius * 0.8, grassRadius * 1.2, distToBall);

  // map world XZ → trail texture UV (ball centered)
  vec2 trailUv = 0.5 - deltaXZ / uGrassChunkSize;
  trailUv.x = 1.0 - trailUv.x; // flip X to match canvas orientation
  trailUv = clamp(trailUv, 0.0, 1.0);

  // scalar trail intensity at this blade
  float trailValue = texture2D(uTrailTexture, trailUv).r;

  // extra clamp very close to the ball
  float nearBallFade = 1.0 - smoothstep(0.0, 1.0, distToBall);
  float nearBallClamp = nearBallFade * trailValue;
  grassHeight *= mix(1.0, grassMinHeight, nearBallClamp);

  // height flattening from trail texture (bright → flattened)
  float flattenFactor = smoothstep(0.6, 1.0, trailValue) * radiusFade;
  grassHeight *= mix(1.0, grassMinHeight, flattenFactor);

  // local trail direction for bending based on gradient (4-tap or 8-tap Sobel)
  vec2 bendDirXZ = vec2(0.0);
  float bendAmount = 0.0;

  if (trailValue > 0.05 && radiusFade > 0.0) { // only compute gradient when trail is present and within radius
    float texel = 1.0 / max(uTrailCanvasSize, 1.0);
    vec2 grad = vec2(0.0);

    if (uSobelMode < 0.5) {
      // Mode 0: 2-tap approximation (Fastest)
      // Check right and bottom neighbors vs center (trailValue)
      float Tx1 = texture2D(uTrailTexture, trailUv + vec2( texel, 0.0)).r;
      float Tz1 = texture2D(uTrailTexture, trailUv + vec2(0.0,  texel)).r;
      grad = vec2(Tx1 - trailValue, Tz1 - trailValue);
      
    } else if (uSobelMode < 1.5) {
      // Mode 1: 4-tap central difference (Balanced)
      float Tx1 = texture2D(uTrailTexture, trailUv + vec2( texel, 0.0)).r;
      float Tx0 = texture2D(uTrailTexture, trailUv + vec2(-texel, 0.0)).r;
      float Tz1 = texture2D(uTrailTexture, trailUv + vec2(0.0,  texel)).r;
      float Tz0 = texture2D(uTrailTexture, trailUv + vec2(0.0, -texel)).r;
      grad = vec2(Tx1 - Tx0, Tz1 - Tz0);
      
    } else {
      // Mode 2: 8-tap Sobel 3x3 (High Quality)
      vec2 t = vec2(texel, texel);

      float T00 = texture2D(uTrailTexture, trailUv + vec2(-t.x, -t.y)).r;
      float T10 = texture2D(uTrailTexture, trailUv + vec2( 0.0, -t.y)).r;
      float T20 = texture2D(uTrailTexture, trailUv + vec2( t.x, -t.y)).r;

      float T01 = texture2D(uTrailTexture, trailUv + vec2(-t.x,  0.0)).r;
      float T21 = texture2D(uTrailTexture, trailUv + vec2( t.x,  0.0)).r;

      float T02 = texture2D(uTrailTexture, trailUv + vec2(-t.x,  t.y)).r;
      float T12 = texture2D(uTrailTexture, trailUv + vec2( 0.0,  t.y)).r;
      float T22 = texture2D(uTrailTexture, trailUv + vec2( t.x,  t.y)).r;

      float gx = (T20 + 2.0 * T21 + T22) - (T00 + 2.0 * T01 + T02);
      float gy = (T02 + 2.0 * T12 + T22) - (T00 + 2.0 * T10 + T20);
      grad = vec2(gx, gy);
    }

    float gradLen = length(grad);

    if (gradLen > 0.0001) {
      // gradDir points toward brighter; we bend away from the bright core
      vec2 gradDir = grad / gradLen;
      bendDirXZ = -gradDir;

      // stronger bending where trail is intense and gradient is sharp (edges)
      float trailStrength = smoothstep(0.3, 1.0, trailValue);
      float edgeFactor    = clamp(gradLen * 5.0, 0.0, 1.0); // gain
      bendAmount = trailStrength * edgeFactor * radiusFade;
    }
  }

  // blade geometry
  int vertFB_ID = gl_VertexID % (GRASS_VERTICES * 2);
  int vertID = vertFB_ID % GRASS_VERTICES;

  int xTest = vertID & 0x1;
  int zTest = vertFB_ID >= GRASS_VERTICES ? 1 : -1;
  float xSide = float(xTest);   // 0 = left, 1 = right
  float zSide = float(zTest);   // front/back side
  float heightPercent = float(vertID - xTest) / (float(GRASS_SEGMENTS) * 2.0);

  float randomHeight = (rand(float(gl_InstanceID)) * 2.0 - 1.0) * 0.2;
  float width = GRASS_WIDTH * easeOut(1.08 - heightPercent, 2.0) * grassHeight;
  float height = GRASS_HEIGHT * grassHeight + randomHeight;

  float x = (xSide - 0.5) * width;
  float y = heightPercent * height;
  float z = 0.0;

  // wind + base bending (bezier curve)
  // Use texture noise for wind
  vec2 windUV = (grassBladeWorldPos.xz * uWindScale * 0.1) + vec2(uTime * uWindSpeed * 0.1);
  float windStrength = texture2D(uNoiseTexture, windUV).r * 2.0 - 1.0;
  
  float windAngle = 0.6;
  vec3 windAxis = vec3(cos(windAngle), 0.0, sin(windAngle));
  float windLeanAngle = windStrength * uWindStrength * heightPercent;
  
  // Secondary high-frequency noise for random animation
  vec2 windUV2 = (grassBladeWorldPos.xz * 0.5) + vec2(uTime * uWindSpeed * 0.02);
  float randomLeanAnimation = (texture2D(uNoiseTexture, windUV2).r * 2.0 - 1.0) * (windStrength * 0.5 + 0.125);

  float leanFactor =
    remap(hashVal.y, -1.0, 1.0, -uLeanFactor, uLeanFactor) + randomLeanAnimation;

  // bezier curve describes the blade center-line bending
  vec3 p1 = vec3(0.0);
  vec3 p2 = vec3(0.0, 0.33, 0.0);
  vec3 p3 = vec3(0.0, 0.66, 0.0);
  vec3 p4 = vec3(0.0, cos(leanFactor), sin(leanFactor));
  vec3 curve = bezier(p1, p2, p3, p4, heightPercent);

  y = curve.y * height;
  z = curve.z * height;

  const float PI = 3.14159;
  float angle = remap(hashVal.x, -1.0, 1.0, -PI / 4.0, PI / 4.0);
  mat3 grassMat = rotateAxis(windAxis, windLeanAngle) * rotateY(angle);

  vec3 grassLocalPosition = grassMat * vec3(x, y, z) + grassOffset;

  // trail-driven sideways bend with height-vs-flatten blending
  if (bendAmount > 0.0) {
    float bendProfile = heightPercent;
    bendProfile *= (1.0 - flattenFactor);

    vec3 bendOffsetWorld = vec3(bendDirXZ.x, 0.0, bendDirXZ.y);
    float maxBend = 0.5;
    vec3 extraBend = bendOffsetWorld * maxBend * bendProfile * bendAmount;
    grassLocalPosition += extraBend;
  }

  // Grass local normal
  vec3 curveGrad = bezierGrad(p1, p2, p3, p4, heightPercent);
  mat2 curveRot90 = mat2(
       0.0,  1.0,
      -1.0,  0.0
    ) * -zSide;

  vec3 grassLocalNormal = grassMat * vec3(0.0, curveRot90 * curveGrad.yz);
  float distanceBlend = smoothstep(0.0, 10.0, distance(cameraPosition, grassBladeWorldPos));
  grassLocalNormal = mix(grassLocalNormal, vec3(0.0, 1.0, 0.0), distanceBlend * 0.5);
  grassLocalNormal = normalize(grassLocalNormal);

  vec4 mvPosition = modelViewMatrix * vec4(grassLocalPosition, 1.0);

  // View space thickening
  vec3 viewDir = normalize(cameraPosition - grassBladeWorldPos);
  vec3 grassFaceNormal = grassMat * vec3(0.0, 0.0, -zSide);
  float viewDotNormal = saturateValue(dot(grassFaceNormal, viewDir));
  float viewSpaceThickenFactor = easeOut(1.0 - viewDotNormal, 4.0) * smoothstep(0.0, 0.2, viewDotNormal);
  mvPosition.x += viewSpaceThickenFactor * (xSide - 0.5) * width * 0.5 * -zSide;

  gl_Position = projectionMatrix * mvPosition;
  gl_Position.w = grassHeight < grassMinHeight ? 0.0 : gl_Position.w;


  // Varyings
  vColor = mix(uGrassBaseColor, uGrassTopColor, heightPercent);
  vNormal = normalize((modelMatrix * vec4(grassLocalNormal, 0.0)).xyz);
  vWorldPosition = (modelMatrix * vec4(grassLocalPosition, 1.0)).xyz;
  vGrassData = vec4(x, heightPercent, xSide, grassMask);
  vTrailValue = trailValue * radiusFade;
}
