import * as THREE from 'three'

import Experience from '../Experience.js'
import TerrainChunk from './TerrainChunk.js'

export default class Terrain {
    constructor() {
        this.experience = new Experience()
        this.resources = this.experience.resources
        this.ball = this.experience.world.ball

        this.chunks = new Map()
        this.chunkSize = 8
        this.currentChunkX = 0
        this.currentChunkZ = 0

        this.setGeometry()
        this.setTextures()
        this.setMaterial()

        this.updateChunks()
    }

    setGeometry() {
        this.geometry = new THREE.PlaneGeometry(this.chunkSize, this.chunkSize)
    }

    setTextures() {
        this.textures = {}

        this.textures.color = this.resources.items.grassColorTexture
        this.textures.color.colorSpace = THREE.SRGBColorSpace
        this.textures.color.repeat.set(1.2, 1.2)
        this.textures.color.wrapS = THREE.RepeatWrapping
        this.textures.color.wrapT = THREE.RepeatWrapping

        this.textures.normal = this.resources.items.grassNormalTexture
        this.textures.normal.repeat.set(1.2, 1.2)
        this.textures.normal.wrapS = THREE.RepeatWrapping
        this.textures.normal.wrapT = THREE.RepeatWrapping
    }

    setMaterial() {
        this.material = new THREE.MeshStandardMaterial({
            map: this.textures.color,
            normalMap: this.textures.normal,
        })
    }

    update() {
        if (this.ball.mesh) {
            const position = this.ball.mesh.position.clone()

            const chunkX = Math.round(position.x / this.chunkSize)
            const chunkZ = Math.round(position.z / this.chunkSize)

            if (
                chunkX !== this.currentChunkX ||
                chunkZ !== this.currentChunkZ
            ) {
                this.currentChunkX = chunkX
                this.currentChunkZ = chunkZ
                this.updateChunks()
            }
        }

        for (const chunk of this.chunks.values()) {
            chunk.update()
        }
    }

    updateChunks() {
        const activeKeys = new Set()

        // Create 3x3 grid around current chunk
        for (let x = -1; x <= 1; x++) {
            for (let z = -1; z <= 1; z++) {
                const chunkX = this.currentChunkX + x
                const chunkZ = this.currentChunkZ + z
                const key = `${chunkX},${chunkZ}`

                activeKeys.add(key)

                if (!this.chunks.has(key)) {
                    const chunk = new TerrainChunk(
                        chunkX,
                        chunkZ,
                        this.chunkSize,
                        this.geometry,
                        this.material
                    )
                    chunk.load()
                    this.chunks.set(key, chunk)
                }
            }
        }

        // Remove chunks that are too far
        for (const [key, chunk] of this.chunks) {
            if (!activeKeys.has(key)) {
                chunk.destroy()
                this.chunks.delete(key)
            }
        }
    }
}
