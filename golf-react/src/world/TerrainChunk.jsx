import { useMemo, useEffect, useRef } from 'react'
import { RigidBody } from '@react-three/rapier'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

import { Grass } from './Grass.jsx'
import useStore from '../stores/useStore.jsx'

import terrainVertexShader from '../shaders/terrain/vertex.glsl'
import terrainFragmentShader from '../shaders/terrain/fragment.glsl'

export default function TerrainChunk({ x, z, size, noise2D, noiseTexture }) {
    const terrainParameters = useStore((s) => s.terrainParameters)
    const borderParameters = useStore((s) => s.borderParameters)

    const meshRef = useRef(null)

    // Geometry
    const geometry = useMemo(() => {
        const segments = terrainParameters.segments
        const scale = terrainParameters.scale
        const amplitude = terrainParameters.amplitude

        const geo = new THREE.PlaneGeometry(size, size, segments, segments)
        const posAttribute = geo.attributes.position

        const chunkWorldX = x * size
        const chunkWorldZ = z * size

        for (let i = 0; i < posAttribute.count; i++) {
            const px = posAttribute.getX(i)
            const py = posAttribute.getY(i)

            const worldX = px + chunkWorldX
            const worldZ = -py + chunkWorldZ

            const heightVal = noise2D(worldX * scale, worldZ * scale) * amplitude

            posAttribute.setZ(i, heightVal)
        }

        return geo
    }, [noise2D, size, x, z, terrainParameters])

    // Material
    const material = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                uBaseColor: { value: new THREE.Color(terrainParameters.color) },
                uFadeColor: {
                    value: new THREE.Color(terrainParameters.fadeColor),
                },
                uCircleCenter: { value: new THREE.Vector3() },
                uTrailPatchSize: { value: size },
                uCircleRadiusFactor: { value: borderParameters.circleRadiusFactor },
                uGrassFadeOffset: { value: borderParameters.grassFadeOffset },
                uGroundOffset: { value: borderParameters.groundOffset },
                uGroundFadeOffset: { value: borderParameters.groundFadeOffset },
            },
            vertexShader: terrainVertexShader,
            fragmentShader: terrainFragmentShader,
        })
    }, [terrainParameters, size, borderParameters])

    useFrame(() => {
        const circleCenter = useStore.getState().smoothedCircleCenter
        meshRef.current?.material.uniforms.uCircleCenter.value.copy(circleCenter)
    })

    useEffect(() => {
        return () => {
            geometry.dispose()
            material.dispose()
        }
    }, [])

    return (
        <group position={[x * size, 0, z * size]}>
            <RigidBody type="fixed" colliders="trimesh" userData={{ name: 'terrain' }}>
                <mesh ref={meshRef} geometry={geometry} material={material} rotation-x={-Math.PI / 2} />
            </RigidBody>

            <Grass
                size={size}
                chunkX={x * size}
                chunkZ={z * size}
                noise2D={noise2D}
                noiseTexture={noiseTexture}
                scale={terrainParameters.scale}
                amplitude={terrainParameters.amplitude}
            />
        </group>
    )
}
