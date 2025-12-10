import { useState, useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { createNoise2D } from 'simplex-noise'
import * as THREE from 'three'

import TerrainChunk from './TerrainChunk.jsx'
import useStore from './stores/useStore.jsx'

import noiseTextureURL from '/textures/noiseTexture.png'

const CHUNK_SIZE = 10

export default function Terrain() {
    const [activeChunks, setActiveChunks] = useState([])
    const currentChunk = useRef({ x: 0, z: 0 })

    // Noise generator
    const noise2D = useMemo(() => createNoise2D(), [])

    // Noise texture
    const noiseTexture = useTexture(
        noiseTextureURL,
        (texture) => {
            texture.wrapS = THREE.RepeatWrapping
            texture.wrapT = THREE.RepeatWrapping
            texture.minFilter = THREE.LinearFilter
            texture.magFilter = THREE.LinearFilter
            return texture
        },
        [noiseTextureURL]
    )

    useFrame(() => {
        const ballPosition = useStore.getState().ballPosition

        const chunkX = Math.round(ballPosition.x / CHUNK_SIZE)
        const chunkZ = Math.round(ballPosition.z / CHUNK_SIZE)

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
                    noiseTexture={noiseTexture}
                />
            ))}
        </group>
    )
}
