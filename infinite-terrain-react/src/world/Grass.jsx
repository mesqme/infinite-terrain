import { useEffect, useMemo } from 'react'
import * as THREE from 'three'

import useStore from '../stores/useStore.jsx'

export default function Grass({ size, chunkX, chunkZ, noise2D, scale, amplitude, grassMaterial }) {
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

    useEffect(() => {
        return () => {
            grassGeometry.dispose()
        }
    }, [grassGeometry])

    return <mesh geometry={grassGeometry} material={grassMaterial} />
}
