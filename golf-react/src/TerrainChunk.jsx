import { useMemo } from 'react'
import * as THREE from 'three'
import { RigidBody } from '@react-three/rapier'
import { Grass } from './Grass.jsx'

export default function TerrainChunk({ x, z, size, noise2D }) {
	console.log('chunk rerender')
	const geometry = useMemo(() => {
		if (!noise2D) return null

		// Increased segments for larger chunk size to maintain detail
		const segments = 32
		const geo = new THREE.PlaneGeometry(size, size, segments, segments)

		const posAttribute = geo.attributes.position
		const scale = 0.05 // Adjust scale for noise frequency (lower = larger features)
		const amplitude = 2 // Adjust amplitude for height

		// Chunk offset in world space (center of the chunk)
		const chunkWorldX = x * size
		const chunkWorldZ = z * size

		for (let i = 0; i < posAttribute.count; i++) {
			const px = posAttribute.getX(i)
			const py = posAttribute.getY(i)

			// Map local geometry coordinates to world coordinates for noise sampling
			// Local X -> World X
			// Local Y -> World -Z (because mesh is rotated -90 deg X)

			const worldX = px + chunkWorldX
			const worldZ = -py + chunkWorldZ

			// Calculate height using simplex noise
			// noise2D returns value between -1 and 1
			const heightVal = noise2D(worldX * scale, worldZ * scale) * amplitude

			// Set Z (which becomes Y in world)
			posAttribute.setZ(i, heightVal)
		}

		geo.computeVertexNormals()
		return geo
	}, [noise2D, size, x, z])

	if (!geometry) return null

	return (
		<group position={[x * size, 0, z * size]}>
			<RigidBody
				type="fixed"
				colliders="trimesh"
				userData={{ name: 'terrain' }}
			>
				<mesh geometry={geometry} receiveShadow rotation-x={-Math.PI / 2}>
					<meshStandardMaterial color="#478f2a" />
				</mesh>
			</RigidBody>
			{/* Add Grass relative to the chunk */}
			<Grass
				size={size}
				chunkX={x * size}
				chunkZ={z * size}
				noise2D={noise2D}
			/>
		</group>
	)
}
