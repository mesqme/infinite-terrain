import RAPIER from '@dimforge/rapier3d'
import * as THREE from 'three'

import Experience from '../Experience.js'
import Grass from './Grass.js'

export default class TerrainChunk {
    constructor(x, z, size, material, terrain) {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.physics = this.experience.physics

        this.x = x
        this.z = z
        this.size = size
        this.position = new THREE.Vector3(x * size, 0, z * size)
        this.material = material
        this.terrain = terrain

        this.setGeometry()
    }

    setGeometry() {
        this.geometry = new THREE.BufferGeometry()

        const segments = 32
        const verticesCount = (segments + 1) * (segments + 1)
        const positions = new Float32Array(verticesCount * 3)
        const uvs = new Float32Array(verticesCount * 2)
        const indices = []

        for (let i = 0; i <= segments; i++) {
            for (let j = 0; j <= segments; j++) {
                const u = j / segments
                const v = i / segments

                const x = u * this.size - this.size / 2
                const z = v * this.size - this.size / 2

                const worldX = this.position.x + x
                const worldZ = this.position.z + z

                // Use terrain height data instead of Perlin noise
                const y = this.terrain.getHeight(worldX, worldZ)

                const index = i * (segments + 1) + j

                positions[index * 3] = x
                positions[index * 3 + 1] = y
                positions[index * 3 + 2] = z

                uvs[index * 2] = u
                uvs[index * 2 + 1] = v
            }
        }

        // Indices
        for (let i = 0; i < segments; i++) {
            for (let j = 0; j < segments; j++) {
                const a = i * (segments + 1) + j
                const b = i * (segments + 1) + j + 1
                const c = (i + 1) * (segments + 1) + j
                const d = (i + 1) * (segments + 1) + j + 1

                indices.push(a, c, b)
                indices.push(b, c, d)
            }
        }

        this.geometry.setAttribute(
            'position',
            new THREE.BufferAttribute(positions, 3)
        )
        this.geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
        this.geometry.setIndex(indices)
        this.geometry.computeVertexNormals()

        // Store data for physics
        this.physicsVertices = positions
        this.physicsIndices = new Uint32Array(indices)
    }

    load() {
        this.setMesh()
        this.setPhysics()
        // this.setGrass()
    }

    setPhysics() {
        const rigidBodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(
            this.position.x,
            this.position.y,
            this.position.z
        )
        this.rigidBody = this.physics.world.createRigidBody(rigidBodyDesc)

        const colliderDesc = RAPIER.ColliderDesc.trimesh(
            this.physicsVertices,
            this.physicsIndices
        )
        this.collider = this.physics.world.createCollider(
            colliderDesc,
            this.rigidBody
        )
    }

    setMesh() {
        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.position.copy(this.position)
        this.mesh.receiveShadow = true
        this.scene.add(this.mesh)
    }

    setGrass() {
        this.grass = new Grass([
            this.position.x,
            this.position.y,
            this.position.z,
        ])
    }

    update() {
        if (this.grass) this.grass.update()
    }

    destroy() {
        // Remove mesh
        if (this.mesh) {
            this.geometry.dispose()
            this.scene.remove(this.mesh)
            this.mesh = null
        }

        // Remove grass
        if (this.grass && this.grass.mesh) {
            this.scene.remove(this.grass.mesh)
            this.grass.destroy()
            this.grass = null
        }

        // Remove physics
        if (this.rigidBody) {
            this.physics.world.removeRigidBody(this.rigidBody)
            this.rigidBody = null
            this.collider = null
        }
    }
}
