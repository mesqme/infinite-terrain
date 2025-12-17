varying vec3 vWorldPosition;
varying vec2 vUv;

void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);

  vWorldPosition = worldPos.xyz;
  vUv = uv;

  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
