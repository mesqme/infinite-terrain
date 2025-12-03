import { useState, useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { createNoise2D } from 'simplex-noise'
import TerrainChunk from './TerrainChunk.jsx'

const CHUNK_SIZE = 10

export default function Terrain() {
	const [activeChunks, setActiveChunks] = useState([])
	const currentChunk = useRef({ x: 0, z: 0 })
	const { scene } = useThree()

	// Initialize noise generator once
	const noise2D = useMemo(() => createNoise2D(), [])

	useFrame((state) => {
		// Try to get player position directly from the scene
		let playerX = 0
		let playerZ = 0

		const ball = scene.getObjectByName('ball')
		if (ball) {
			const position = ball.position
			playerX = position.x
			playerZ = position.z
		} else {
			// Fallback to camera estimation
			playerX = state.camera.position.x
			playerZ = state.camera.position.z - 4.25
		}

		const chunkX = Math.round(playerX / CHUNK_SIZE)
		const chunkZ = Math.round(playerZ / CHUNK_SIZE)

		if (
			chunkX !== currentChunk.current.x ||
			chunkZ !== currentChunk.current.z ||
			activeChunks.length === 0
		) {
			currentChunk.current = { x: chunkX, z: chunkZ }

			const newChunks = []
			for (let x = -1; x <= 1; x++) {
				for (let z = -1; z <= 1; z++) {
					newChunks.push({
						x: chunkX + x,
						z: chunkZ + z,
						key: `${chunkX + x},${chunkZ + z}`,
					})
				}
			}
			setActiveChunks(newChunks)
		}
	})

	return (
		<group>
			{activeChunks.map((chunk) => (
				<TerrainChunk
					key={chunk.key}
					x={chunk.x}
					z={chunk.z}
					size={CHUNK_SIZE}
					noise2D={noise2D}
				/>
			))}
		</group>
	)
}
