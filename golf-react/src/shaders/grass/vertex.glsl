uniform vec4 uGrassParameters;
uniform vec3 uGrassBaseColor;
uniform vec3 uGrassTopColor;
uniform float uTime;
uniform bool uSquareShape;
uniform float uLeanFactor;

uniform float uWindScale;
uniform float uWindStrength;
uniform float uWindSpeed;

uniform float uPositionX;
uniform float uPositionZ;

uniform sampler2D uTrailTexture;
uniform vec3 uBallPosition;

attribute vec3 aInstancePosition;

varying vec3 vColor;
varying vec4 vGrassData;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vTrailValue;

#include includes.glsl

void main() {
  int GRASS_SEGMENTS = int(uGrassParameters.x);
  int GRASS_VERTICES = (GRASS_SEGMENTS + 1) * 2;
  float GRASS_PATCH_SIZE = uGrassParameters.y; // size * 0.5
  float GRASS_WIDTH = uGrassParameters.z;
  float GRASS_HEIGHT = uGrassParameters.w;

  vec3 grassOffset = aInstancePosition;
  vec3 grassBladeWorldPos = (modelMatrix * vec4(grassOffset, 1.0)).xyz;
  vec3 hashVal = hash(grassBladeWorldPos);

  float grassHeight = 1.0;

  // ---------------------------------------------------------------------------
  // Trail texture sampling + gradient-based bending data
  // ---------------------------------------------------------------------------
  vec2 worldXZ = grassBladeWorldPos.xz;
  vec2 ballXZ  = uBallPosition.xz;

  // BallTrailCanvas uses CHUNK_SIZE as patch size;
  // here GRASS_PATCH_SIZE is size / 2, so patchSize = size.
  float patchSize = GRASS_PATCH_SIZE * 2.0;

  vec2 deltaXZ = worldXZ - ballXZ;
  float distToBall = length(deltaXZ);
  float radius = GRASS_PATCH_SIZE;
  float radiusFade = 1.0 - smoothstep(radius * 0.8, radius, distToBall);

  // Map world → texture UV (ball-centered)
  // uv.x = 0.5 - (worldX - ballX) / patchSize
  // uv.y = 0.5 - (worldZ - ballZ) / patchSize
  vec2 trailUv = 0.5 - deltaXZ / patchSize;

  // fix left/right mirroring to match canvas
  trailUv.x = 1.0 - trailUv.x;

  trailUv = clamp(trailUv, 0.0, 1.0);

    float trailValue = texture2D(uTrailTexture, trailUv).r;

  // Flattening factor based on trail intensity
  // Dark → tall grass, bright → flattened
  float flattenFactor = smoothstep(0.6, 1.0, trailValue) * radiusFade;
  float minHeightFactor = 0.2; // blades can shrink to 20% height
  grassHeight *= mix(1.0, minHeightFactor, flattenFactor);

  // Gradient (3x3 Sobel-style) to get direction of the trail field
  float texel = 1.0 / 256.0; // canvas is 256x256

  vec2 t = vec2(texel, texel);

  float T00 = texture2D(uTrailTexture, trailUv + vec2(-t.x, -t.y)).r;
  float T10 = texture2D(uTrailTexture, trailUv + vec2( 0.0, -t.y)).r;
  float T20 = texture2D(uTrailTexture, trailUv + vec2( t.x, -t.y)).r;

  float T01 = texture2D(uTrailTexture, trailUv + vec2(-t.x,  0.0)).r;
  float T21 = texture2D(uTrailTexture, trailUv + vec2( t.x,  0.0)).r;

  float T02 = texture2D(uTrailTexture, trailUv + vec2(-t.x,  t.y)).r;
  float T12 = texture2D(uTrailTexture, trailUv + vec2( 0.0,  t.y)).r;
  float T22 = texture2D(uTrailTexture, trailUv + vec2( t.x,  t.y)).r;

  // Sobel-ish gradient
  float gx = (T20 + 2.0 * T21 + T22) - (T00 + 2.0 * T01 + T02);
  float gy = (T02 + 2.0 * T12 + T22) - (T00 + 2.0 * T10 + T20);
  vec2 grad = vec2(gx, gy);
  float gradLen = length(grad);

  // Bend direction and amount (computed now, applied later)
  vec2 bendDirXZ = vec2(0.0);
  float bendAmount = 0.0;

  if (trailValue > 0.2 && gradLen > 0.0001) {
    vec2 gradDir = grad / gradLen;       // towards brighter
    bendDirXZ = -gradDir;                // bend away from bright center

    float trailStrength = smoothstep(0.3, 1.0, trailValue);
    float edgeFactor    = clamp(gradLen * 5.0, 0.0, 1.0); // 5.0 is tweak
    bendAmount = trailStrength * edgeFactor * radiusFade;
  }

  // ---------------------------------------------------------------------------
  // End trail sampling & gradient
  // ---------------------------------------------------------------------------

  // Figure out vertex id, > GRASS_VERTICES is other side
  int vertFB_ID = gl_VertexID % (GRASS_VERTICES * 2);
  int vertID = vertFB_ID % GRASS_VERTICES; // even - left, odd - right

  // 0 = left, 1 = right
  int xTest = vertID & 0x1;
  int zTest = vertFB_ID >= GRASS_VERTICES ? 1 : -1;
  float xSide = float(xTest);
  float zSide = float(zTest);
  float heightPercent = float(vertID - xTest) / (float(GRASS_SEGMENTS) * 2.0);

  // Random height
  float randomHeight = (rand(float(gl_InstanceID)) * 2.0 - 1.0) * 0.1;
  float width = uSquareShape
    ? GRASS_WIDTH
    : GRASS_WIDTH * easeOut(1.08 - heightPercent, 2.0) * grassHeight;
  float height = GRASS_HEIGHT * grassHeight + randomHeight;

  // Calculate the vertex position
  float x = (xSide - 0.5) * width;
  float y = heightPercent * height;
  float z = 0.0;

  // Grass wind parameters
  float windStrength = noise(
    vec3(grassBladeWorldPos.xz * uWindScale, 0.0) + uTime * uWindSpeed
  );
  float windAngle = 0.0;
  vec3 windAxis = vec3(cos(windAngle), 0.0, sin(windAngle));
  float windLeanAngle = windStrength * uWindStrength * heightPercent;
  float randomLeanAnimation =
    noise(vec3(grassBladeWorldPos.xz, uTime * uWindSpeed * 1.3)) *
    (windStrength * 0.5 + 0.125);

  // Grass lean factor
  float leanFactor =
    remap(hashVal.y, -1.0, 1.0, -uLeanFactor, uLeanFactor) + randomLeanAnimation;

  // Bend the grass blade (base curve from wind + randomness)
  vec3 p1 = vec3(0.0);
  vec3 p2 = vec3(0.0, 0.33, 0.0);
  vec3 p3 = vec3(0.0, 0.66, 0.0);
  vec3 p4 = vec3(0.0, cos(leanFactor), sin(leanFactor));
  vec3 curve = bezier(p1, p2, p3, p4, heightPercent);

  y = curve.y * height; // change Y coord with curve
  z = curve.z * height; // change Z coord with curve

  // Generate grass matrix for rotation
  const float PI = 3.14159;
  float angle = remap(hashVal.x, -1.0, 1.0, -PI / 4.0, PI / 4.0); // randomize blades initial rotation
  mat3 grassMat = rotateAxis(windAxis, windLeanAngle) * rotateY(angle);

  // Calculate the final position
  vec3 grassLocalPosition = grassMat * vec3(x, y, z) + grassOffset;

  // Apply trail-based extra bend (stronger at tips)
  if (bendAmount > 0.0) {
    vec3 bendOffsetWorld = vec3(bendDirXZ.x, 0.0, bendDirXZ.y);
    float maxBend = 0.5; // tweak: world units at tip when fully bent
    vec3 extraBend = bendOffsetWorld * maxBend * heightPercent * bendAmount;
    grassLocalPosition += extraBend;
  }

  // Calculate normal
  vec3 curveGrad = bezierGrad(p1, p2, p3, p4, heightPercent);
  mat2 curveRot90 =
    mat2(
       0.0,  1.0,
      -1.0,  0.0
    ) *
    -zSide;
  vec3 grassLocalNormal = grassMat * vec3(0.0, curveRot90 * curveGrad.yz);

  // Blend normal
  float distanceBlend = smoothstep(
    0.0,
    10.0,
    distance(cameraPosition, grassBladeWorldPos)
  );
  grassLocalNormal = mix(
    grassLocalNormal,
    vec3(0.0, 1.0, 0.0),
    distanceBlend * 0.5
  );
  grassLocalNormal = normalize(grassLocalNormal);

  // Viewspace thicken
  vec4 mvPosition = modelViewMatrix * vec4(grassLocalPosition, 1.0);

  vec3 viewDir = normalize(cameraPosition - grassBladeWorldPos);
  vec3 grassFaceNormal = grassMat * vec3(0.0, 0.0, -zSide);

  float viewDotNormal = saturateValue(dot(grassFaceNormal, viewDir));
  float viewSpaceThickenFactor =
    easeOut(1.0 - viewDotNormal, 4.0) * smoothstep(0.0, 0.2, viewDotNormal);

  mvPosition.x +=
    viewSpaceThickenFactor * (xSide - 0.5) * width * 0.5 * -zSide;

  gl_Position = projectionMatrix * mvPosition;
  gl_Position.w = grassHeight < 0.25 ? 0.0 : gl_Position.w;

  // Pass the color to the fragment shader
  vColor = mix(uGrassBaseColor, uGrassTopColor, heightPercent);

  vNormal = normalize((modelMatrix * vec4(grassLocalNormal, 0.0)).xyz);
  vWorldPosition = (modelMatrix * vec4(grassLocalPosition, 1.0)).xyz;
  vGrassData = vec4(x, heightPercent, xSide, 0.0);
  vTrailValue = trailValue * radiusFade;
}
