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
        color: '#a79a65',
        fadeColor: '#fff5cf',
    })

    const smoothedCircleCenter = useStore((s) => s.smoothedCircleCenter) // smoothed center for circle effect
    const trailPatchSize = useStore((s) => s.trailPatchSize)

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
            },
            vertexShader: terrainVertexShader,
            fragmentShader: terrainFragmentShader,
        })
    }, [controls.color, controls.fadeColor, trailPatchSize])

    // Keep uniforms in sync with Leva / store
    useEffect(() => {
        material.uniforms.uBaseColor.value.set(controls.color)
        material.uniforms.uTrailPatchSize.value = trailPatchSize
    }, [controls.color, trailPatchSize, material])

    // Per-frame: use smoothed circle center (lerps with camera)
    useFrame(() => {
        material.uniforms.uCircleCenter.value.copy(smoothedCircleCenter)
    })

    useEffect(() => {
        return () => {
            geometry?.dispose()
            material.dispose()
        }
    }, [geometry, material])

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
