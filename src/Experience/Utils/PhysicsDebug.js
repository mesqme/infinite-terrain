import Experience from '../Experience.js'
import * as THREE from 'three'

export default class PhysicsDebug {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.physics = this.experience.physics

        this.debugGeometry = new THREE.BufferGeometry()

        this.debugMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff,
            vertexColors: true,
        })

        this.debugMesh = new THREE.LineSegments(
            this.debugGeometry,
            this.debugMaterial
        )

        this.scene.add(this.debugMesh)
    }

    update() {
        const { vertices, colors } = this.physics.world.debugRender()

        if (!vertices || !colors) return

        this.debugGeometry.setAttribute(
            'position',
            new THREE.BufferAttribute(vertices, 3)
        )
        this.debugGeometry.setAttribute(
            'color',
            new THREE.BufferAttribute(colors, 4)
        )
    }
}
