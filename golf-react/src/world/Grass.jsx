import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

import useStore from '../stores/useStore.jsx'

import grassFragmentShader from '../shaders/grass/fragment.glsl'
import grassVertexShader from '../shaders/grass/vertex.glsl'

const Grass = ({ size, chunkX, chunkZ, noise2D, noiseTexture, scale, amplitude }) => {
    const grassRef = useRef(null)

    const trailParameters = useStore((s) => s.trailParameters)
    const borderParameters = useStore((s) => s.borderParameters)
    const grassParameters = useStore((s) => s.grassParameters)

    // Geometry
    const grassGeometry = useMemo(() => {
        const vertexNumber = (grassParameters.segmentsCount + 1) * 2
        const indices = []

        for (let i = 0; i < grassParameters.segmentsCount; ++i) {
            const vi = i * 2
            indices[i * 12] = vi
            indices[i * 12 + 1] = vi + 1
            indices[i * 12 + 2] = vi + 2

            indices[i * 12 + 3] = vi + 2
            indices[i * 12 + 4] = vi + 1
            indices[i * 12 + 5] = vi + 3

            const fi = vertexNumber + vi
            indices[i * 12 + 6] = fi + 2
            indices[i * 12 + 7] = fi + 1
            indices[i * 12 + 8] = fi

            indices[i * 12 + 9] = fi + 3
            indices[i * 12 + 10] = fi + 1
            indices[i * 12 + 11] = fi + 2
        }

        const grassGeometry = new THREE.InstancedBufferGeometry()
        grassGeometry.instanceCount = grassParameters.count
        grassGeometry.setIndex(indices)
        grassGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1 + size / 2)

        // distribute blades inside this chunk; Y from terrain noise
        const positions = new Float32Array(grassParameters.count * 3)

        for (let i = 0; i < grassParameters.count; i++) {
            const x = (Math.random() - 0.5) * size
            const z = (Math.random() - 0.5) * size

            const worldX = x + chunkX
            const worldZ = z + chunkZ

            const y = noise2D ? noise2D(worldX * scale, worldZ * scale) * amplitude : 0

            positions[i * 3] = x
            positions[i * 3 + 1] = y
            positions[i * 3 + 2] = z
        }

        grassGeometry.setAttribute('aInstancePosition', new THREE.InstancedBufferAttribute(positions, 3))

        return grassGeometry
    }, [grassParameters.segmentsCount, grassParameters.count, size, chunkX, chunkZ, noise2D, scale, amplitude])

    // Material
    const grassMaterial = useMemo(
        () =>
            new THREE.ShaderMaterial({
                uniforms: {
                    uTime: { value: 0 },
                    uResolution: { value: new THREE.Vector2(1, 1) },
                    uGrassSegments: { value: grassParameters.segmentsCount },
                    uGrassChunkSize: { value: size },
                    uGrassWidth: { value: grassParameters.width },
                    uGrassHeight: { value: grassParameters.height },
                    uGrassBaseColor: { value: new THREE.Color(grassParameters.colorBase) },
                    uGrassTopColor: { value: new THREE.Color(grassParameters.colorTop) },
                    uLeanFactor: { value: grassParameters.leanFactor },
                    uPositionX: { value: chunkX },
                    uPositionZ: { value: chunkZ },

                    uWindScale: { value: grassParameters.windScale },
                    uWindStrength: { value: grassParameters.windStrength },
                    uWindSpeed: { value: grassParameters.windSpeed },
                    uTrailTexture: { value: null },
                    uBallPosition: { value: new THREE.Vector3() },
                    uCircleCenter: { value: new THREE.Vector3() },
                    uTrailCanvasSize: { value: trailParameters.canvasSize },
                    uSobelMode: { value: grassParameters.sobelMode },

                    uNoiseTexture: { value: noiseTexture },
                    uNoiseStrength: { value: borderParameters.noiseStrength },
                    uNoiseScale: { value: borderParameters.noiseScale },
                    uCircleRadiusFactor: { value: borderParameters.circleRadiusFactor },
                    uGrassFadeOffset: { value: borderParameters.grassFadeOffset },
                    uGroundOffset: { value: borderParameters.groundOffset },
                    uGroundFadeOffset: { value: borderParameters.groundFadeOffset },
                },
                vertexShader: grassVertexShader,
                fragmentShader: grassFragmentShader,
                side: THREE.FrontSide,
            }),
        [grassParameters, size, chunkX, chunkZ, trailParameters.canvasSize, noiseTexture, borderParameters]
    )

    useEffect(() => {
        return () => {
            grassGeometry.dispose()
            grassMaterial.dispose()
        }
    }, [])

    useFrame(({ clock }) => {
        grassMaterial.uniforms.uTime.value = clock.elapsedTime

        const state = useStore.getState()
        grassMaterial.uniforms.uTrailTexture.value = state.trailTexture
        grassMaterial.uniforms.uBallPosition.value.copy(state.ballPosition)
        grassMaterial.uniforms.uCircleCenter.value.copy(state.smoothedCircleCenter)
    })

    return <mesh ref={grassRef} geometry={grassGeometry} material={grassMaterial} />
}

export { Grass }
