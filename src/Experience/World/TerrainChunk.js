import RAPIER from '@dimforge/rapier3d'
import * as THREE from 'three'

import Experience from '../Experience.js'
import Grass from './Grass.js'

export default class TerrainChunk {
    constructor(x, z, size, geometry, material) {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.physics = this.experience.physics

        this.x = x
        this.z = z
        this.size = size
        this.position = new THREE.Vector3(x * size, 0, z * size)
        this.geometry = geometry
        this.material = material
    }

    load() {
        this.setMesh()
        this.setPhysics()
        this.setGrass()
    }

    setPhysics() {
        const rigidBodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(
            this.position.x,
            this.position.y,
            this.position.z
        )
        this.rigidBody = this.physics.world.createRigidBody(rigidBodyDesc)

        const colliderDesc = RAPIER.ColliderDesc.cuboid(
            this.size / 2,
            0.001,
            this.size / 2
        )
        this.collider = this.physics.world.createCollider(
            colliderDesc,
            this.rigidBody
        )
    }

    setMesh() {
        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.rotation.x = -Math.PI * 0.5
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
