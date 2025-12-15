import { useMemo, useEffect } from 'react'
import { RigidBody } from '@react-three/rapier'
import * as THREE from 'three'

import Grass from './Grass.jsx'
import useStore from '../stores/useStore.jsx'

export default function TerrainChunk({ x, z, size, noise2D, noiseTexture, terrainMaterial, grassMaterial }) {
    const terrainParameters = useStore((s) => s.terrainParameters)

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

    useEffect(() => {
        return () => {
            geometry.dispose()
        }
    }, [geometry])

    return (
        <group position={[x * size, 0, z * size]}>
            <RigidBody type="fixed" colliders="trimesh" userData={{ name: 'terrain' }}>
                <mesh geometry={geometry} material={terrainMaterial} rotation-x={-Math.PI / 2} />
            </RigidBody>

            <Grass
                size={size}
                chunkX={x * size}
                chunkZ={z * size}
                noise2D={noise2D}
                noiseTexture={noiseTexture}
                scale={terrainParameters.scale}
                amplitude={terrainParameters.amplitude}
                grassMaterial={grassMaterial}
            />
        </group>
    )
}
