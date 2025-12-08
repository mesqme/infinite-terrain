import { useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { useControls } from 'leva'
import { RigidBody } from '@react-three/rapier'
import { useFrame } from '@react-three/fiber'

import { Grass } from './Grass.jsx'
import useStore from './stores/useStore.jsx'

import terrainVertexShader from './shaders/ground/vertex.glsl'
import terrainFragmentShader from './shaders/ground/fragment.glsl'

export default function TerrainChunk({ x, z, size, noise2D }) {
    const controls = useControls('TerrainChunk', {
        color: '#908343', //#8f844f //#8d7f3c //#908343
        fadeColor: '#9a9065', //#4b483f //#5f8da0 //#9a9065 //#807750 //#9a8c4f
    })

    const smoothedCircleCenter = useStore((s) => s.smoothedCircleCenter) // smoothed center for circle effect
    const trailPatchSize = useStore((s) => s.trailPatchSize)
    const noiseStrength = useStore((s) => s.noiseStrength) // noise strength for irregular edge
    const noiseScale = useStore((s) => s.noiseScale) // noise scale for irregular edge
    const circleRadiusFactor = useStore((s) => s.circleRadiusFactor) // circle radius factor

    // noise texture for irregular edge (shared with grass)
    const noiseTexture = useMemo(() => {
        const loader = new THREE.TextureLoader()
        const texture = loader.load('/textures/noiseTexture.png')
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        texture.minFilter = THREE.LinearFilter
        texture.magFilter = THREE.LinearFilter
        return texture
    }, [])

    const geometry = useMemo(() => {
        if (!noise2D) return null

        const segments = 32
        const geo = new THREE.PlaneGeometry(size, size, segments, segments)

        const posAttribute = geo.attributes.position
        const scale = 0.05
        const amplitude = 2

        const chunkWorldX = x * size
        const chunkWorldZ = z * size

        for (let i = 0; i < posAttribute.count; i++) {
            const px = posAttribute.getX(i)
            const py = posAttribute.getY(i)

            const worldX = px + chunkWorldX
            const worldZ = -py + chunkWorldZ

            const heightVal =
                noise2D(worldX * scale, worldZ * scale) * amplitude

            posAttribute.setZ(i, heightVal)
        }

        geo.computeVertexNormals()
        return geo
    }, [noise2D, size, x, z])

    const material = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                uBaseColor: { value: new THREE.Color(controls.color) },
                uFadeColor: { value: new THREE.Color(controls.fadeColor) },
                uCircleCenter: { value: new THREE.Vector3() }, // smoothed center for visual circle
                uTrailPatchSize: { value: trailPatchSize },
                // noise texture for irregular edge
                uNoiseTexture: { value: noiseTexture },
                uNoiseStrength: { value: noiseStrength },
                uNoiseScale: { value: noiseScale },
                // circle radius factor
                uCircleRadiusFactor: { value: circleRadiusFactor },
            },
            vertexShader: terrainVertexShader,
            fragmentShader: terrainFragmentShader,
        })
    }, [
        controls.color,
        controls.fadeColor,
        trailPatchSize,
        noiseTexture,
        noiseStrength,
        noiseScale,
        circleRadiusFactor,
    ])

    // Keep uniforms in sync with Leva / store
    useEffect(() => {
        material.uniforms.uBaseColor.value.set(controls.color)
        material.uniforms.uTrailPatchSize.value = trailPatchSize
        material.uniforms.uNoiseStrength.value = noiseStrength
        material.uniforms.uNoiseScale.value = noiseScale
        material.uniforms.uCircleRadiusFactor.value = circleRadiusFactor
    }, [
        controls.color,
        trailPatchSize,
        noiseStrength,
        noiseScale,
        circleRadiusFactor,
        material,
    ])

    // Per-frame: use smoothed circle center (lerps with camera)
    useFrame(() => {
        material.uniforms.uCircleCenter.value.copy(smoothedCircleCenter)
    })

    useEffect(() => {
        return () => {
            geometry?.dispose()
            material.dispose()
            noiseTexture.dispose()
        }
    }, [geometry, material, noiseTexture])

    if (!geometry) return null

    return (
        <group position={[x * size, 0, z * size]}>
            <RigidBody
                type="fixed"
                colliders="trimesh"
                userData={{ name: 'terrain' }}
            >
                <mesh geometry={geometry} rotation-x={-Math.PI / 2}>
                    <primitive object={material} attach="material" />
                </mesh>
            </RigidBody>

            <Grass
                size={size}
                chunkX={x * size}
                chunkZ={z * size}
                noise2D={noise2D}
            />
        </group>
    )
}
