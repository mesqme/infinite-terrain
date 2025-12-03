// inverseLerp and remap are for remapping values
float inverseLerp(float v, float minValue, float maxValue) {
  return (v - minValue) / (maxValue - minValue);
}
float remap(float v, float inMin, float inMax, float outMin, float outMax) {
  float t = inverseLerp(v, inMin, inMax);
  return mix(outMin, outMax, t);
}

// Used in viewspace thickening
float saturateValue(float x) {
  return clamp(x, 0.0, 1.0);
}
float easeOut(float x, float t) {
  return 1.0 - pow(1.0 - x, t);
}

// hash21 and murmurHash21 are for hashing the instance ID to a vec2 for position offset
uvec2 murmurHash21(uint src) {
  const uint M = 0x5bd1e995u;
  uvec2 h = uvec2(1190494759u, 2147483647u);
  src *= M;
  src ^= src >> 24u;
  src *= M;
  h *= M;
  h ^= src;
  h ^= h >> 13u;
  h *= M;
  h ^= h >> 15u;
  return h;
}
// 1 input -> 2 output
vec2 hash21(float src) {
  uvec2 h = murmurHash21(floatBitsToUint(src));
  return uintBitsToFloat((h & 0x007fffffu) | 0x3f800000u) - 1.0;
}

// The MIT License
// Copyright © 2013 Inigo Quilez
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
// https://www.youtube.com/c/InigoQuilez
// https://iquilezles.org/
//
// https://www.shadertoy.com/view/Xsl3Dl
vec3 hash(
  vec3 p // replace this by something better
) {
  p = vec3(
    dot(p, vec3(127.1, 311.7, 74.7)),
    dot(p, vec3(269.5, 183.3, 246.1)),
    dot(p, vec3(113.5, 271.9, 124.6))
  );

  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

// Bezier curve function for bending the grass blade
vec3 bezier(vec3 P0, vec3 P1, vec3 P2, vec3 P3, float t) {
  return (1.0 - t) * (1.0 - t) * (1.0 - t) * P0 +
  3.0 * (1.0 - t) * (1.0 - t) * t * P1 +
  3.0 * (1.0 - t) * t * t * P2 +
  t * t * t * P3;
}

// Normal calculations
vec3 bezierGrad(vec3 P0, vec3 P1, vec3 P2, vec3 P3, float t) {
  return 3.0 * (1.0 - t) * (1.0 - t) * (P1 - P0) +
  6.0 * (1.0 - t) * t * (P2 - P1) +
  3.0 * t * t * (P3 - P2);
}

// Rotation matrix functions
mat3 rotateY(float theta) {
  float c = cos(theta);
  float s = sin(theta);
  return mat3(vec3(c, 0, s), vec3(0, 1, 0), vec3(-s, 0, c));
}

mat3 rotateAxis(vec3 axis, float angle) {
  float s = sin(angle);
  float c = cos(angle);
  float oc = 1.0 - c;

  return mat3(
    oc * axis.x * axis.x + c,
    oc * axis.x * axis.y - axis.z * s,
    oc * axis.z * axis.x + axis.y * s,
    oc * axis.x * axis.y + axis.z * s,
    oc * axis.y * axis.y + c,
    oc * axis.y * axis.z - axis.x * s,
    oc * axis.z * axis.x - axis.y * s,
    oc * axis.y * axis.z + axis.x * s,
    oc * axis.z * axis.z + c
  );
}

// Noise function for wind
float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);

  vec3 u = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(
      mix(
        dot(hash(i + vec3(0.0, 0.0, 0.0)), f - vec3(0.0, 0.0, 0.0)),
        dot(hash(i + vec3(1.0, 0.0, 0.0)), f - vec3(1.0, 0.0, 0.0)),
        u.x
      ),
      mix(
        dot(hash(i + vec3(0.0, 1.0, 0.0)), f - vec3(0.0, 1.0, 0.0)),
        dot(hash(i + vec3(1.0, 1.0, 0.0)), f - vec3(1.0, 1.0, 0.0)),
        u.x
      ),
      u.y
    ),
    mix(
      mix(
        dot(hash(i + vec3(0.0, 0.0, 1.0)), f - vec3(0.0, 0.0, 1.0)),
        dot(hash(i + vec3(1.0, 0.0, 1.0)), f - vec3(1.0, 0.0, 1.0)),
        u.x
      ),
      mix(
        dot(hash(i + vec3(0.0, 1.0, 1.0)), f - vec3(0.0, 1.0, 1.0)),
        dot(hash(i + vec3(1.0, 1.0, 1.0)), f - vec3(1.0, 1.0, 1.0)),
        u.x
      ),
      u.y
    ),
    u.z
  );
}

// Random function for height
float rand(float n) {
  return fract(sin(n) * 43758.5453123);
}
