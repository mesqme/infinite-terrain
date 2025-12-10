uniform vec4 uGrassParameters;   // x: segments, y: patchSizeHalf, z: width, w: height
uniform vec3 uGrassBaseColor;
uniform vec3 uGrassTopColor;
uniform float uTime;
uniform float uLeanFactor;

uniform float uWindScale;
uniform float uWindStrength;
uniform float uWindSpeed;

uniform float uPositionX;
uniform float uPositionZ;

// trail data
uniform sampler2D uTrailTexture;
uniform vec3 uBallPosition;      // actual ball position for trail texture sampling
uniform vec3 uCircleCenter;      // smoothed center for visual circle effect (lerps with camera)
uniform float uTrailPatchSize;   // world size mapped to texture (matches CHUNK_SIZE)
uniform float uTrailTexelSize;   // 1.0 / textureResolution
uniform float uSobelMode;        // 0.0 = 4-tap, 1.0 = 8-tap Sobel

// noise texture for irregular edge
uniform sampler2D uNoiseTexture;
uniform float uNoiseStrength;    // how much noise affects the edge (0-1)
uniform float uNoiseScale;       // scale of noise sampling
uniform float uCircleRadiusFactor; // multiplier for uTrailPatchSize to get circle radius

attribute vec3 aInstancePosition; // per-blade base position in chunk space

varying vec3 vColor;
varying vec4 vGrassData;         // x: local x, y: heightPercent, z: side, w: unused
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vTrailValue;       // trail intensity used in fragment for color tweak

#include includes.glsl

void main() {
  int GRASS_SEGMENTS = int(uGrassParameters.x);
  int GRASS_VERTICES = (GRASS_SEGMENTS + 1) * 2;
  float GRASS_PATCH_SIZE = uGrassParameters.y;
  float GRASS_WIDTH = uGrassParameters.z;
  float GRASS_HEIGHT = uGrassParameters.w;

  // base blade anchor in world space
  vec3 grassOffset = aInstancePosition;
  vec3 grassBladeWorldPos = (modelMatrix * vec4(grassOffset, 1.0)).xyz;
  vec3 hashVal = hash(grassBladeWorldPos);

  float grassHeight = 1.0;

  // ---------------------------------------------------------------------------
  // Trail texture UV mapping (uses actual ball position)
  // ---------------------------------------------------------------------------
  vec2 worldXZ = grassBladeWorldPos.xz;
  vec2 ballXZ  = uBallPosition.xz;  // actual ball position for trail texture
  float patchSize = uTrailPatchSize; // world dimension that maps to full texture

  vec2 deltaXZ = worldXZ - ballXZ;
  
  // ---------------------------------------------------------------------------
  // Ball blend sphere – radial height fade at the chunk-sized circle
  // Uses smoothed circle center for visual effect (lerps with camera)
  // Applies Perlin noise from texture to create irregular edge
  // ---------------------------------------------------------------------------
  vec2 circleXZ = uCircleCenter.xz;
  vec2 deltaXZCircle = worldXZ - circleXZ;
  float distToCircle = length(deltaXZCircle);
  
  // Circle radius ~ half of trail patch (i.e. roughly chunk size / 2)
  float baseBlendRadius = uTrailPatchSize * uCircleRadiusFactor;
  
  // Sample noise texture based on world position to create irregular edge
  vec2 noiseUV = worldXZ * uNoiseScale * 0.01; // scale noise sampling
  float noiseValue = texture2D(uNoiseTexture, noiseUV).r; // sample Perlin noise (0-1)
  
  // Remap noise from 0-1 to -1 to 1, then apply strength
  float noiseOffset = (noiseValue - 0.5) * 2.0 * uNoiseStrength;
  
  // Apply noise offset to the radius to create irregular edge
  float blendRadius = baseBlendRadius * (1.0 + noiseOffset);
  float blendInner  = blendRadius * 0.7;   // start fading a bit before the edge

  // 0 inside inner, 1 at and beyond blendRadius (now irregular due to noise)
  float ballEdgeFade = smoothstep(blendInner, blendRadius, distToCircle);

  // At the "white surround" edge grass should be very short / almost gone
  float sphereMinHeightFactor = 0.15;
  grassHeight *= mix(1.0, sphereMinHeightFactor, ballEdgeFade);

  // ---------------------------------------------------------------------------
  // Trail sampling (texture) + additional radial fade for trail itself
  // Uses actual ball position for trail texture sampling
  // ---------------------------------------------------------------------------
  float distToBall = length(deltaXZ);  // distance to actual ball for trail texture
  float radius = uTrailPatchSize * 0.5;
  float radiusFade = 1.0 - smoothstep(radius * 0.8, radius, distToBall);

  // map world XZ → trail texture UV (ball centered)
  vec2 trailUv = 0.5 - deltaXZ / patchSize;
  trailUv.x = 1.0 - trailUv.x; // flip X to match canvas orientation
  trailUv = clamp(trailUv, 0.0, 1.0);

  // scalar trail intensity at this blade
  float trailValue = texture2D(uTrailTexture, trailUv).r;

  // Extra clamp very close to the ball, modulated by trail texture (goes black when ball is airborne)
  float nearBallRadius = uTrailPatchSize * 0.1;
  float nearBallFade = 1.0 - smoothstep(0.0, nearBallRadius, distToBall); // 1 at center → 0 at radius
  float nearBallMinHeight = 0.4; // minimum proportion when touching the ball
  // If trailValue is black (ball jumping), the clamp is suppressed; brightest keeps the clamp
  float nearBallClamp = nearBallFade * trailValue;
  grassHeight *= mix(1.0, nearBallMinHeight, nearBallClamp);

  // ---------------------------------------------------------------------------
  // Height flattening from trail texture (bright → flattened)
  // ---------------------------------------------------------------------------
  float flattenFactor = smoothstep(0.6, 1.0, trailValue) * radiusFade;
  float minHeightFactor = 0.2; // blades can shrink to 20% of original height
  grassHeight *= mix(1.0, minHeightFactor, flattenFactor);

  // ---------------------------------------------------------------------------
  // Gradient: local trail direction for bending (4-tap or 8-tap Sobel)
  // ---------------------------------------------------------------------------
  vec2 bendDirXZ = vec2(0.0);
  float bendAmount = 0.0;

  // only compute gradient when trail is present and within radius
  if (trailValue > 0.05 && radiusFade > 0.0) {
    float texel = uTrailTexelSize;
    vec2 grad = vec2(0.0);

    if (uSobelMode < 0.5) {
      // 4-tap central difference: left/right, up/down
      float Tx1 = texture2D(uTrailTexture, trailUv + vec2( texel, 0.0)).r;
      float Tx0 = texture2D(uTrailTexture, trailUv + vec2(-texel, 0.0)).r;
      float Tz1 = texture2D(uTrailTexture, trailUv + vec2(0.0,  texel)).r;
      float Tz0 = texture2D(uTrailTexture, trailUv + vec2(0.0, -texel)).r;

      grad = vec2(Tx1 - Tx0, Tz1 - Tz0);
    } else {
      // 8-tap Sobel-like: 3x3 kernel
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

  // ---------------------------------------------------------------------------
  // Blade geometry: figure out which vertex this is, and build the curve
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Wind + base bending (bezier curve)
  // ---------------------------------------------------------------------------
  float windStrength = noise(
    vec3(grassBladeWorldPos.xz * uWindScale, 0.0) + uTime * uWindSpeed
  );
  float windAngle = 0.6;
  vec3 windAxis = vec3(cos(windAngle), 0.0, sin(windAngle));
  float windLeanAngle = windStrength * uWindStrength * heightPercent;
  float randomLeanAnimation =
    noise(vec3(grassBladeWorldPos.xz, uTime * uWindSpeed * 1.3)) *
    (windStrength * 0.5 + 0.125);

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

  // ---------------------------------------------------------------------------
  // Trail-driven sideways bend with height-vs-flatten blending
  // ---------------------------------------------------------------------------
  if (bendAmount > 0.0) {
    // base: stronger bend near tips
    float bendProfile = heightPercent;

    // reduce sideways bend where grass is already very flattened by trail
    bendProfile *= (1.0 - flattenFactor);

    vec3 bendOffsetWorld = vec3(bendDirXZ.x, 0.0, bendDirXZ.y);
    float maxBend = 0.5;
    vec3 extraBend = bendOffsetWorld * maxBend * bendProfile * bendAmount;
    grassLocalPosition += extraBend;
  }

  // ---------------------------------------------------------------------------
  // Normal computation and view-dependent thickening
  // ---------------------------------------------------------------------------
  vec3 curveGrad = bezierGrad(p1, p2, p3, p4, heightPercent);
  mat2 curveRot90 =
    mat2(
       0.0,  1.0,
      -1.0,  0.0
    ) *
    -zSide;
  vec3 grassLocalNormal = grassMat * vec3(0.0, curveRot90 * curveGrad.yz);

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

  vec4 mvPosition = modelViewMatrix * vec4(grassLocalPosition, 1.0);

  vec3 viewDir = normalize(cameraPosition - grassBladeWorldPos);
  vec3 grassFaceNormal = grassMat * vec3(0.0, 0.0, -zSide);

  float viewDotNormal = saturateValue(dot(grassFaceNormal, viewDir));
  float viewSpaceThickenFactor =
    easeOut(1.0 - viewDotNormal, 4.0) * smoothstep(0.0, 0.2, viewDotNormal);

  mvPosition.x +=
    viewSpaceThickenFactor * (xSide - 0.5) * width * 0.5 * -zSide;

  gl_Position = projectionMatrix * mvPosition;
  // hard-clip very flattened blades if needed
  gl_Position.w = grassHeight < 0.25 ? 0.0 : gl_Position.w;

  // ---------------------------------------------------------------------------
  // Varyings to fragment shader
  // ---------------------------------------------------------------------------
  vColor = mix(uGrassBaseColor, uGrassTopColor, heightPercent);
  vNormal = normalize((modelMatrix * vec4(grassLocalNormal, 0.0)).xyz);
  vWorldPosition = (modelMatrix * vec4(grassLocalPosition, 1.0)).xyz;
  vGrassData = vec4(x, heightPercent, xSide, 0.0);
  vTrailValue = trailValue * radiusFade;
}
