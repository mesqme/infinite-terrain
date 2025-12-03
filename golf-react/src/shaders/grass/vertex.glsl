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

attribute vec3 aInstancePosition;

varying vec3 vColor;
varying vec4 vGrassData;
varying vec3 vNormal;
varying vec3 vWorldPosition;

#include includes.glsl

void main() {
  int GRASS_SEGMENTS = int(uGrassParameters.x);
  int GRASS_VERTICES = (GRASS_SEGMENTS + 1) * 2;
  float GRASS_PATCH_SIZE = uGrassParameters.y;
  float GRASS_WIDTH = uGrassParameters.z;
  float GRASS_HEIGHT = uGrassParameters.w;

  // Use the passed instance position directly (it contains local X, height Y, local Z)
  vec3 grassOffset = aInstancePosition;
  
  // Generate hash for lean value for the grass blade
  vec3 grassBladeWorldPos = (modelMatrix * vec4(grassOffset, 1.0)).xyz; // get the world position of the grass blade
  vec3 hashVal = hash(grassBladeWorldPos); // generate hash value from the world position

  float grassHeight = 1.0;

  // Figure out vertex id, > GRASS_VERTICES is other side
  int vertFB_ID = gl_VertexID % (GRASS_VERTICES * 2);
  int vertID = vertFB_ID % GRASS_VERTICES; // even - left, odd - right

  // 0 = left, 1 = right
  int xTest = vertID & 0x1;
  int zTest = vertFB_ID >= GRASS_VERTICES ? 1 : -1;
  float xSide = float(xTest);
  float zSide = float(zTest);
  float heightPercent = float(vertID - xTest) / (float(GRASS_SEGMENTS) * 2.0);

  // Rnadom height
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

  // Bend the grass blade
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
  vec3 grassLocalPosition = grassMat * vec3(x, y, z) + grassOffset; // change initial XYZ coords with offset and rotation matrix

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

  mvPosition.x += viewSpaceThickenFactor * (xSide - 0.5) * width * 0.5 * -zSide;

  gl_Position = projectionMatrix * mvPosition;
  gl_Position.w = grassHeight < 0.25 ? 0.0 : gl_Position.w;
  // gl_Position = projectionMatrix * modelViewMatrix * vec4(grassLocalPosition, 1.0);

  // Pass the color to the fragment shader
  vColor = mix(uGrassBaseColor, uGrassTopColor, heightPercent);

  vNormal = normalize((modelMatrix * vec4(grassLocalNormal, 0.0)).xyz);
  vWorldPosition = (modelMatrix * vec4(grassLocalPosition, 1.0)).xyz;
  vGrassData = vec4(x, heightPercent, xSide, 0.0);
}
