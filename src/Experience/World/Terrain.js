import * as THREE from 'three'

import Experience from '../Experience.js'
import TerrainChunk from './TerrainChunk.js'

export default class Terrain {
    constructor() {
        this.experience = new Experience()
        this.resources = this.experience.resources
        this.ball = this.experience.world.ball

        this.chunks = new Map()
        this.chunkSize = 16
        this.currentChunkX = 0
        this.currentChunkZ = 0

        this.setTextures()
        this.setMaterial()

        this.updateChunks()
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

        // Height data
        const noiseTexture = this.resources.items.noiseTexture
        if (noiseTexture) {
            const canvas = document.createElement('canvas')
            canvas.width = noiseTexture.image.width
            canvas.height = noiseTexture.image.height
            const context = canvas.getContext('2d')
            context.drawImage(noiseTexture.image, 0, 0)
            this.heightData = context.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
            )
        }
    }

    getHeight(x, z) {
        if (!this.heightData) return 0

        const width = this.heightData.width
        const height = this.heightData.height

        // Map world coordinates to texture coordinates
        // We'll use a scale factor to control frequency
        const scale = 2.0 // Pixels per world unit
        let u = (x * scale) % width
        let v = (z * scale) % height

        // Handle negative coordinates for wrapping
        if (u < 0) u += width
        if (v < 0) v += height

        // Bilinear interpolation for smoother terrain
        const x1 = Math.floor(u)
        const x2 = (x1 + 1) % width
        const z1 = Math.floor(v)
        const z2 = (z1 + 1) % height

        const fx = u - x1
        const fz = v - z1

        // Helper to get pixel value (red channel)
        const getVal = (px, pz) => {
            const index = (pz * width + px) * 4
            return this.heightData.data[index] / 255
        }

        const h1 = getVal(x1, z1)
        const h2 = getVal(x2, z1)
        const h3 = getVal(x1, z2)
        const h4 = getVal(x2, z2)

        const lerpX1 = h1 + (h2 - h1) * fx
        const lerpX2 = h3 + (h4 - h3) * fx

        const h = lerpX1 + (lerpX2 - lerpX1) * fz

        return h * 8 - 4 // Scale height amplitude
    }

    setMaterial() {
        this.material = new THREE.MeshStandardMaterial({
            map: this.textures.color,
            normalMap: this.textures.normal,
            // wireframe: true,
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
                        this.material,
                        this // Pass terrain instance
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
