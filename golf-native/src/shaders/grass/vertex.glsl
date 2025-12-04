uniform vec4 grassParams;
uniform float time;

attribute vec3 aInstancePosition;

varying vec3 vColor;
varying vec4 vGrassData;
varying vec3 vNormal;
varying vec3 vWorldPosition;

float inverseLerp(float v, float minValue, float maxValue) {
  return (v - minValue) / (maxValue - minValue);
}

float remap(float v, float inMin, float inMax, float outMin, float outMax) {
  float t = inverseLerp(v, inMin, inMax);
  return mix(outMin, outMax, t);
}

float saturateValue(float x) {
  return clamp(x, 0.0, 1.0);
}

// Hashing functions
uvec2 murmurHash21(uint src) {
  const uint M = 0x5bd1e995u;
  uvec2 h = uvec2(1190494759u, 2147483647u);
  src *= M;
  src ^= src>>24u;
  src *= M;
  h *= M;
  h ^= src;
  h ^= h>>13u;
  h *= M;
  h ^= h>>15u;
  return h;
}

vec2 hash21(float src) {
  uvec2 h = murmurHash21(floatBitsToUint(src));
  return uintBitsToFloat(h & 0x007fffffu | 0x3f800000u) - 1.0;
}

vec3 hash(vec3 p) {
  p = vec3(
      dot(p,vec3(127.1,311.7, 74.7)),
      dot(p,vec3(269.5,183.3,246.1)),
      dot(p,vec3(113.5,271.9,124.6)));
  return -1.0 + 2.0*fract(sin(p)*43758.5453123);
}

float noise(in vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f*f*(3.0-2.0*f);
  
  return mix(mix(mix( dot( hash( i + vec3(0.0,0.0,0.0) ), f - vec3(0.0,0.0,0.0) ), 
                      dot( hash( i + vec3(1.0,0.0,0.0) ), f - vec3(1.0,0.0,0.0) ), u.x),
                 mix( dot( hash( i + vec3(0.0,1.0,0.0) ), f - vec3(0.0,1.0,0.0) ), 
                      dot( hash( i + vec3(1.0,1.0,0.0) ), f - vec3(1.0,1.0,0.0) ), u.x), u.y),
            mix(mix( dot( hash( i + vec3(0.0,0.0,1.0) ), f - vec3(0.0,0.0,1.0) ), 
                     dot( hash( i + vec3(1.0,0.0,1.0) ), f - vec3(1.0,0.0,1.0) ), u.x),
                mix( dot( hash( i + vec3(0.0,1.0,1.0) ), f - vec3(0.0,1.0,1.0) ), 
                     dot( hash( i + vec3(1.0,1.0,1.0) ), f - vec3(1.0,1.0,1.0) ), u.x), u.y), u.z );
}

float easeOut(float x, float t) {
  return 1.0 - pow(1.0 - x, t);
}

mat3 rotateY(float theta) {
  float c = cos(theta);
  float s = sin(theta);
  return mat3(
      vec3(c, 0, s),
      vec3(0, 1, 0),
      vec3(-s, 0, c)
  );
}

mat3 rotateAxis(vec3 axis, float angle) {
  float s = sin(angle);
  float c = cos(angle);
  float oc = 1.0 - c;
  
  return mat3(
    oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,
    oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,
    oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c
  );
}

vec3 bezier(vec3 P0, vec3 P1, vec3 P2, vec3 P3, float t) {
  return (1.0 - t) * (1.0 - t) * (1.0 - t) * P0 +
         3.0 * (1.0 - t) * (1.0 - t) * t * P1 +
         3.0 * (1.0 - t) * t * t * P2 +
         t * t * t * P3;
}

vec3 bezierGrad(vec3 P0, vec3 P1, vec3 P2, vec3 P3, float t) {
  return 3.0 * (1.0 - t) * (1.0 - t) * (P1 - P0) +
         6.0 * (1.0 - t) * t * (P2 - P1) +
         3.0 * t * t * (P3 - P2);
}

const vec3 BASE_COLOR = vec3(0.1, 0.4, 0.04);
const vec3 TIP_COLOR = vec3(0.5, 0.7, 0.3);

void main() {
  int GRASS_SEGMENTS = int(grassParams.x);
  int GRASS_VERTICES = (GRASS_SEGMENTS + 1) * 2;
  float GRASS_PATCH_SIZE = grassParams.y;
  float GRASS_WIDTH = grassParams.z;
  float GRASS_HEIGHT = grassParams.w;

  // Instance offset (includes noise-based Y height from terrain)
  vec3 grassOffset = aInstancePosition;
  
  vec3 grassBladeWorldPos = (modelMatrix * vec4(grassOffset, 1.0)).xyz;
  vec3 hashVal = hash(grassBladeWorldPos);

  float grassType = saturateValue(hashVal.z) > 0.75 ? 1.0 : 0.0;

  // Rotation
  const float PI = 3.14159;
  float angle = remap(hashVal.x, -1.0, 1.0, -PI, PI);

  float stiffness = 0.5;
  float tileGrassHeight = mix(1.0, 1.5, grassType);

  // Vertex ID calculation
  int vertFB_ID = gl_VertexID % (GRASS_VERTICES * 2);
  int vertID = vertFB_ID % GRASS_VERTICES;

  int xTest = vertID & 0x1;
  int zTest = (vertFB_ID >= GRASS_VERTICES) ? 1 : -1;
  float xSide = float(xTest);
  float zSide = float(zTest);
  float heightPercent = float(vertID - xTest) / (float(GRASS_SEGMENTS) * 2.0);

  float width = GRASS_WIDTH * easeOut(1.08 - heightPercent, 2.0);
  float height = GRASS_HEIGHT * tileGrassHeight;

  // Height randomization
  float randomHeight = (hashVal.y * 2.0 - 1.0) * 0.4;
  height += randomHeight;

  // Discard short grass
  if (height < 0.3) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0); // Outside clip space
      return;
  }

  // Base position
  float x = (xSide - 0.5) * width;
  float y = heightPercent * height;
  float z = 0.0;

  // Wind and Lean
  float windScale = 0.5;
  float windSpeed = 1.0;
  
  float windStrength = noise(vec3(grassBladeWorldPos.xz * windScale, 0.0) + time * windSpeed);
  float flutter = noise(vec3(grassBladeWorldPos.xz * 1.0, 0.0) + time * 1.5) * 0.1;
  
  float windCombined = windStrength + flutter;
  
  float windAngle = 0.0 + windCombined * 0.2;
  vec3 windAxis = vec3(cos(windAngle), 0.0, sin(windAngle));
  
  float windLeanAngle = windCombined * 1.0 * heightPercent * stiffness;

  float randomLeanAnimation = noise(
      vec3(grassBladeWorldPos.xz, time * 1.5)) * (windCombined * 0.5 + 0.125);
  
  float leanFactor = remap(hashVal.y, -1.0, 1.0, -0.2, 0.2) + randomLeanAnimation;

  // Bezier Curve
  vec3 p1 = vec3(0.0);
  vec3 p2 = vec3(0.0, 0.5, 0.0);
  vec3 p3 = vec3(0.0, 0.8, 0.0);
  vec3 p4 = vec3(0.0, cos(leanFactor), sin(leanFactor));
  vec3 curve = bezier(p1, p2, p3, p4, heightPercent);

  vec3 curveGrad = bezierGrad(p1, p2, p3, p4, heightPercent);
  mat2 curveRot90 = mat2(0.0, 1.0, -1.0, 0.0) * -zSide;

  y = curve.y * height;
  z = curve.z * height;
  
  if (heightPercent < 0.01) {
    y = 0.0;
    z = 0.0;
  }

  // Transform
  mat3 grassMat = rotateAxis(windAxis, windLeanAngle) * rotateY(angle);

  vec3 grassLocalPosition = grassMat * vec3(x, y, z) + grassOffset;
  vec3 exactLocalNormal = grassMat * vec3(0.0, curveRot90 * curveGrad.yz);

  // Calculate world data early for view-dependent effects
  vec4 worldPosition = modelMatrix * vec4(grassLocalPosition, 1.0);
  vec3 viewDir = normalize(cameraPosition - worldPosition.xyz);
  vec3 exactWorldNormal = normalize((modelMatrix * vec4(exactLocalNormal, 0.0)).xyz);

  // Viewspace Thicken
  vec4 mvPosition = modelViewMatrix * vec4(grassLocalPosition, 1.0);

  float viewDotNormal = saturateValue(abs(dot(exactWorldNormal, viewDir)));
  float viewSpaceThickenFactor = pow(1.0 - viewDotNormal, 3.0);

  // Widen the blade in view space without splitting faces
  mvPosition.x += viewSpaceThickenFactor * (xSide - 0.5) * width * 0.5;

  // Blend Normal for lighting
  vec3 grassLocalNormal = exactLocalNormal;
  float distanceBlend = smoothstep(
      0.0, 10.0, distance(cameraPosition, worldPosition.xyz));
  grassLocalNormal = mix(grassLocalNormal, vec3(0.0, 1.0, 0.0), distanceBlend * 0.5);
  grassLocalNormal = normalize(grassLocalNormal);

  gl_Position = projectionMatrix * mvPosition;
  gl_Position.w = tileGrassHeight < 0.25 ? 0.0 : gl_Position.w;

  vColor = mix(BASE_COLOR, TIP_COLOR, heightPercent);
  
  // Color variation
  float colorVar = hashVal.x * 0.1; 
  vColor += vec3(colorVar * 0.5, colorVar, colorVar * 0.5);

  vNormal = normalize((modelMatrix * vec4(grassLocalNormal, 0.0)).xyz);
  vWorldPosition = worldPosition.xyz;

  vGrassData = vec4(x, heightPercent, xSide, grassType);
}