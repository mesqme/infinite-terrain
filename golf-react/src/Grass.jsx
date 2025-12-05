import { useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useControls } from 'leva'
import { useEffect, useMemo, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

import useStore from './stores/useStore.jsx'

// import { Butterfly } from './Butterfly'
import grassFragmentShader from './shaders/grass/fragment.glsl'
import grassVertexShader from './shaders/grass/vertex.glsl'

const Grass = ({ size = 10, chunkX = 0, chunkZ = 0, noise2D }) => {
    const grassRef = useRef(null)
    const trailTexture = useStore((s) => s.trailTexture)
    const ballPosition = useStore((s) => s.ballPosition)

    // Controls
    const controls = useControls('Grass', {
        colorBase: '#478f2a', // #7b6111
        colorTop: '#7bd948', // #c5c346
        count: { value: 3000, min: 0, max: 5000, step: 10 },
        segmentsCount: { value: 4, min: 1, max: 10, step: 1 },
        // patchSize removed, using size prop
        width: { value: 0.15, min: 0, max: 0.4, step: 0.001 },
        height: { value: 1.5, min: 0, max: 3, step: 0.01 },
        leanFactor: { value: 0.15, min: 0, max: 1, step: 0.01 },
        squared: false,
        // position removed, using chunkX/chunkZ props
    })

    const windControls = useControls('Wind', {
        scale: { value: 2.0, min: -5, max: 5, step: 0.01 },
        strength: { value: 0.07, min: -1.5, max: 1.5, step: 0.01 },
        speed: { value: 0.8, min: 0, max: 2, step: 0.01 },
    })

    // Geometry
    const grassGeometry = useMemo(() => {
        const vertexNumber = (controls.segmentsCount + 1) * 2
        const indices = []

        for (let i = 0; i < controls.segmentsCount; ++i) {
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
        grassGeometry.instanceCount = controls.count
        grassGeometry.setIndex(indices)
        grassGeometry.boundingSphere = new THREE.Sphere(
            new THREE.Vector3(0, 0, 0),
            1 + size / 2
        )

        // Generate positions and height using noise
        const positions = new Float32Array(controls.count * 3)
        const scale = 0.05
        const amplitude = 2

        for (let i = 0; i < controls.count; i++) {
            const x = (Math.random() - 0.5) * size
            const z = (Math.random() - 0.5) * size

            const worldX = x + chunkX
            const worldZ = z + chunkZ

            // Calculate height using same noise parameters as TerrainChunk
            const y = noise2D
                ? noise2D(worldX * scale, worldZ * scale) * amplitude
                : 0

            positions[i * 3] = x
            positions[i * 3 + 1] = y
            positions[i * 3 + 2] = z
        }

        grassGeometry.setAttribute(
            'aInstancePosition',
            new THREE.InstancedBufferAttribute(positions, 3)
        )

        return grassGeometry
    }, [controls.segmentsCount, size, controls.count, chunkX, chunkZ, noise2D])

    // Materials
    const grassMaterial = useMemo(
        () =>
            new THREE.ShaderMaterial({
                uniforms: {
                    uTime: { value: 0 },
                    uResolution: { value: new THREE.Vector2(1, 1) },
                    uGrassParameters: {
                        value: new THREE.Vector4(
                            controls.segmentsCount,
                            size / 2,
                            controls.width,
                            controls.height
                        ),
                    },
                    uGrassBaseColor: {
                        value: new THREE.Color(controls.colorBase),
                    },
                    uGrassTopColor: {
                        value: new THREE.Color(controls.colorTop),
                    },
                    uLeanFactor: { value: controls.leanFactor },
                    uSquareShape: { value: controls.squared },
                    uPositionX: { value: chunkX },
                    uPositionZ: { value: chunkZ },

                    uWindScale: { value: windControls.scale },
                    uWindStrength: { value: windControls.strength },
                    uWindSpeed: { value: windControls.speed },

                    uTrailTexture: { value: null },
                    uBallPosition: { value: new THREE.Vector3() },
                },
                vertexShader: grassVertexShader,
                fragmentShader: grassFragmentShader,
                side: THREE.FrontSide,
            }),
        [controls, windControls, size, chunkX, chunkZ]
    )

    // Update material uniforms from Leva controls
    useEffect(() => {
        grassMaterial.uniforms.uGrassBaseColor.value = new THREE.Color(
            controls.colorBase
        )
        grassMaterial.uniforms.uGrassTopColor.value = new THREE.Color(
            controls.colorTop
        )
        grassMaterial.uniforms.uGrassParameters.value.x = controls.segmentsCount
        grassMaterial.uniforms.uGrassParameters.value.y = size / 2
        grassMaterial.uniforms.uGrassParameters.value.z = controls.width
        grassMaterial.uniforms.uGrassParameters.value.w = controls.height
        grassMaterial.uniforms.uLeanFactor.value = controls.leanFactor
        grassMaterial.uniforms.uSquareShape.value = controls.squared
        grassMaterial.uniforms.uWindScale.value = windControls.scale
        grassMaterial.uniforms.uWindStrength.value = windControls.strength
        grassMaterial.uniforms.uWindSpeed.value = windControls.speed
        grassMaterial.uniforms.uPositionX.value = chunkX
        grassMaterial.uniforms.uPositionZ.value = chunkZ
    }, [controls, windControls, grassMaterial, size, chunkX, chunkZ])

    /**
     * Trail texture uniform
     */
    useEffect(() => {
        if (trailTexture) {
            grassMaterial.uniforms.uTrailTexture.value = trailTexture
        }
    }, [trailTexture, grassMaterial])

    // Update time for grass
    useFrame(({ clock }) => {
        grassMaterial.uniforms.uTime.value = clock.elapsedTime
        grassMaterial.uniforms.uBallPosition.value.copy(ballPosition)
    })

    const scene = useThree((state) => state.scene)

    // Removed manual scene add/remove to use React tree

    return (
        <>
            <mesh
                ref={grassRef}
                geometry={grassGeometry}
                material={grassMaterial}
            />
            {/* <GrassSparkles scale={size / 2} /> */}
        </>
    )
}

export { Grass }
