import { useFrame, useThree } from '@react-three/fiber'
import { useControls } from 'leva'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

import useStore from './stores/useStore.jsx'
import grassFragmentShader from './shaders/grass/fragment.glsl'
import grassVertexShader from './shaders/grass/vertex.glsl'

const Grass = ({ size = 10, chunkX = 0, chunkZ = 0, noise2D }) => {
    const grassRef = useRef(null)

    // trail data from Zustand (shared with BallTrailCanvas)
    const trailTexture = useStore((s) => s.trailTexture)
    const ballPosition = useStore((s) => s.ballPosition)
    const trailPatchSize = useStore((s) => s.trailPatchSize) // world size mapped onto trail texture
    const trailTexelSize = useStore((s) => s.trailTexelSize) // 1.0 / textureResolution

    // grass look / distribution
    const controls = useControls('Grass', {
        colorBase: '#478f2a',
        colorTop: '#7bd948',
        count: { value: 5000, min: 0, max: 5000, step: 10 },
        segmentsCount: { value: 6, min: 1, max: 10, step: 1 },
        width: { value: 0.12, min: 0, max: 0.4, step: 0.001 },
        height: { value: 0.9, min: 0, max: 3, step: 0.01 },
        leanFactor: { value: 0.25, min: 0, max: 1, step: 0.01 },
        squared: false,
        sobelMode: { value: 1.0, min: 0, max: 1, step: 1 },
    })

    // global wind for grass animation
    const windControls = useControls('Wind', {
        scale: { value: 2.0, min: -5, max: 5, step: 0.01 },
        strength: { value: 0.07, min: -1.5, max: 1.5, step: 0.01 },
        speed: { value: 0.8, min: 0, max: 2, step: 0.01 },
    })

    // instanced grass geometry: one blade mesh, many instance positions
    const grassGeometry = useMemo(() => {
        const vertexNumber = (controls.segmentsCount + 1) * 2
        const indices = []

        // build index buffer for a double-sided strip of quads per blade
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

        // distribute blades inside this chunk; Y from terrain noise
        const positions = new Float32Array(controls.count * 3)
        const scale = 0.05
        const amplitude = 2

        for (let i = 0; i < controls.count; i++) {
            const x = (Math.random() - 0.5) * size
            const z = (Math.random() - 0.5) * size

            const worldX = x + chunkX
            const worldZ = z + chunkZ

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
    }, [controls.segmentsCount, controls.count, size, chunkX, chunkZ, noise2D])

    // ShaderMaterial with custom grass + trail logic
    const grassMaterial = useMemo(
        () =>
            new THREE.ShaderMaterial({
                uniforms: {
                    uTime: { value: 0 },
                    uResolution: { value: new THREE.Vector2(1, 1) },
                    uGrassParameters: {
                        value: new THREE.Vector4(
                            controls.segmentsCount, // segments
                            size / 2, // patch half-size for grass itself
                            controls.width, // base width
                            controls.height // base height
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

                    // trail uniforms
                    uTrailTexture: { value: null },
                    uBallPosition: { value: new THREE.Vector3() },
                    uTrailPatchSize: { value: trailPatchSize },
                    uTrailTexelSize: { value: trailTexelSize },
                    uSobelMode: { value: controls.sobelMode }, // 0.0 = 4-tap, 1.0 = 8-tap Sobel
                },
                vertexShader: grassVertexShader,
                fragmentShader: grassFragmentShader,
                side: THREE.FrontSide,
            }),
        [
            controls,
            windControls,
            size,
            chunkX,
            chunkZ,
            trailPatchSize,
            trailTexelSize,
        ]
    )

    // push Leva + chunk props into uniforms (no shader recompiles on tweak)
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
        grassMaterial.uniforms.uTrailPatchSize.value = trailPatchSize
        grassMaterial.uniforms.uTrailTexelSize.value = trailTexelSize
        // uSobelMode is set in useMemo, no need to update here
    }, [
        controls,
        windControls,
        grassMaterial,
        size,
        chunkX,
        chunkZ,
        trailPatchSize,
        trailTexelSize,
    ])

    // attach trail texture once it's available
    useEffect(() => {
        if (trailTexture) {
            grassMaterial.uniforms.uTrailTexture.value = trailTexture
        }
    }, [trailTexture, grassMaterial])

    // per-frame time and ball position (for wind + trail mapping)
    useFrame(({ clock }) => {
        grassMaterial.uniforms.uTime.value = clock.elapsedTime
        grassMaterial.uniforms.uBallPosition.value.copy(ballPosition)
    })

    // clean up GPU resources on unmount
    useEffect(() => {
        return () => {
            grassGeometry.dispose()
            grassMaterial.dispose()
        }
    }, [grassGeometry, grassMaterial])

    // we don't need scene here, but this keeps hook ordering consistent
    useThree((state) => state.scene)

    return (
        <mesh
            ref={grassRef}
            geometry={grassGeometry}
            material={grassMaterial}
        />
    )
}

export { Grass }
