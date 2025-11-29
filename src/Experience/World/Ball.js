import * as THREE from 'three'
import Experience from '../Experience.js'
import RAPIER from '@dimforge/rapier3d'

const BASE_RADIUS = 0.4
const BASE_FORCES = {
    jump: 6.5,
    impulse: 3.3,
    torque: 0.6,
}

const CAMERA_POSITION = new THREE.Vector3(0, 7, 10)
const RAYCASTER_ORIGIN_Y_OFFSET = 0.1 - 0.02

export default class Ball {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.physics = this.experience.physics
        this.debug = this.experience.debug
        this.time = this.experience.time
        this.camera = this.experience.camera.instance
        this.cameraControls = this.experience.camera.controls

        this.params = {
            position: { x: 0, y: 2, z: 0 },
            radius: 0.3,
            mass: 1,
            restitution: 0.2,
            friction: 1,
            linearDamping: 1.5,
            angularDamping: 2.5,
            forceScaling: 0.1, // Non-linear scaling factor
        }

        this.smoothedCameraPosition = new THREE.Vector3(0, 7, 10)
        this.smoothedCameraTarget = new THREE.Vector3()

        this.keys = {
            forward: false,
            backward: false,
            leftward: false,
            rightward: false,
            jump: false,
        }

        this.setGeometry()
        this.setMaterial()
        this.setMesh()
        this.setPhysics()
        this.setControls()
        this.setParams()
    }

    setGeometry() {
        this.geometry = new THREE.IcosahedronGeometry(this.params.radius, 1)
    }

    setMaterial() {
        this.material = new THREE.MeshStandardMaterial({
            color: '#ffffff',
            roughness: 0.4,
            metalness: 0.3,
            flatShading: true,
        })
    }

    setMesh() {
        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.position.copy(this.params.position)
        this.mesh.castShadow = true
        this.scene.add(this.mesh)
    }

    setPhysics() {
        // Rigid Body
        const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(
                this.params.position.x,
                this.params.position.y,
                this.params.position.z
            )
            .setLinearDamping(this.params.linearDamping)
            .setAngularDamping(this.params.angularDamping)
            .setCanSleep(false)

        this.rigidBody = this.physics.world.createRigidBody(rigidBodyDesc)

        // Collider
        const colliderDesc = RAPIER.ColliderDesc.ball(this.params.radius)
            .setMass(this.params.mass)
            .setRestitution(this.params.restitution)
            .setFriction(this.params.friction)

        this.collider = this.physics.world.createCollider(
            colliderDesc,
            this.rigidBody
        )
    }

    setControls() {
        window.addEventListener('keydown', (event) => {
            switch (event.code) {
                case 'KeyW':
                case 'ArrowUp':
                    this.keys.forward = true
                    break
                case 'KeyS':
                case 'ArrowDown':
                    this.keys.backward = true
                    break
                case 'KeyA':
                case 'ArrowLeft':
                    this.keys.leftward = true
                    break
                case 'KeyD':
                case 'ArrowRight':
                    this.keys.rightward = true
                    break
                case 'Space':
                    this.jump()
                    break
            }
        })

        window.addEventListener('keyup', (event) => {
            switch (event.code) {
                case 'KeyW':
                case 'ArrowUp':
                    this.keys.forward = false
                    break
                case 'KeyS':
                case 'ArrowDown':
                    this.keys.backward = false
                    break
                case 'KeyA':
                case 'ArrowLeft':
                    this.keys.leftward = false
                    break
                case 'KeyD':
                case 'ArrowRight':
                    this.keys.rightward = false
                    break
            }
        })
    }

    getForces() {
        const ratio = this.params.radius / BASE_RADIUS
        const scale = Math.pow(ratio, this.params.forceScaling)

        return {
            jump: BASE_FORCES.jump * scale,
            impulse: BASE_FORCES.impulse * scale,
            torque: BASE_FORCES.torque * scale,
        }
    }

    jump() {
        const origin = this.rigidBody.translation()
        const direction = { x: 0, y: -1, z: 0 }
        const ray = new RAPIER.Ray(origin, direction)

        const hit = this.physics.world.castRay(
            ray,
            10,
            false,
            undefined,
            undefined,
            undefined,
            this.rigidBody // Exclude self
        )

        // Check if close to ground (distance from center to ground should be approx radius)
        if (hit && hit.timeOfImpact < this.params.radius + 0.15) {
            const forces = this.getForces()
            this.rigidBody.applyImpulse({ x: 0, y: forces.jump, z: 0 }, true)
        }
    }

    // Debug
    setParams() {
        if (this.debug.active) {
            this.debugFolder = this.debug.pane.addFolder({ title: 'ball' })

            this.debugFolder
                .addBinding(this.params, 'position', {
                    label: 'pos',
                })
                .on('change', () => {
                    this.reset()
                })

            this.debugFolder
                .addBinding(this.params, 'radius', {
                    min: 0.1,
                    max: 2.0,
                    step: 0.1,
                })
                .on('change', () => {
                    this.updateRadius()
                })

            this.debugFolder.addBinding(this.params, 'forceScaling', {
                min: 0.1,
                max: 5.0,
                step: 0.1,
                label: 'forcePower',
            })

            this.debugFolder
                .addButton({
                    title: 'Reset',
                })
                .on('click', () => {
                    this.reset()
                })
        }
    }

    updateRadius() {
        // Remove old collider
        if (this.collider) {
            this.physics.world.removeCollider(this.collider, false)
        }

        // Dispose geometry
        this.geometry.dispose()
        this.geometry = new THREE.IcosahedronGeometry(this.params.radius, 1)
        this.mesh.geometry = this.geometry

        // Create new collider
        const colliderDesc = RAPIER.ColliderDesc.ball(this.params.radius)
            .setMass(this.params.mass)
            .setRestitution(this.params.restitution)
            .setFriction(this.params.friction)

        this.collider = this.physics.world.createCollider(
            colliderDesc,
            this.rigidBody
        )
    }

    reset() {
        this.rigidBody.setTranslation(
            new RAPIER.Vector3(
                this.params.position.x,
                this.params.position.y,
                this.params.position.z
            ),
            true
        )
        this.rigidBody.setLinvel(new RAPIER.Vector3(0, 0, 0), true)
        this.rigidBody.setAngvel(new RAPIER.Vector3(0, 0, 0), true)
    }

    update() {
        const delta = this.time.delta * 0.001

        const forces = this.getForces()

        const impulse = { x: 0, y: 0, z: 0 }
        const torque = { x: 0, y: 0, z: 0 }

        const impulseStrength = forces.impulse * delta
        const torqueStrength = forces.torque * delta

        if (this.keys.forward) {
            this.rigidBody.wakeUp()
            impulse.z -= impulseStrength
            torque.x -= torqueStrength
        }

        if (this.keys.rightward) {
            this.rigidBody.wakeUp()
            impulse.x += impulseStrength
            torque.z -= torqueStrength
        }

        if (this.keys.backward) {
            this.rigidBody.wakeUp()
            impulse.z += impulseStrength
            torque.x += torqueStrength
        }

        if (this.keys.leftward) {
            this.rigidBody.wakeUp()
            impulse.x -= impulseStrength
            torque.z += torqueStrength
        }

        this.rigidBody.applyImpulse(impulse, true)
        this.rigidBody.applyTorqueImpulse(torque, true)

        const position = this.rigidBody.translation()
        const rotation = this.rigidBody.rotation()

        this.mesh.position.copy(position)
        this.mesh.quaternion.copy(rotation)

        // Camera Follow
        const cameraPosition = new THREE.Vector3()
            .copy(position)
            .add(CAMERA_POSITION)
        const cameraTarget = new THREE.Vector3().copy(position)

        this.smoothedCameraPosition.lerp(cameraPosition, 5 * delta)
        this.smoothedCameraTarget.lerp(cameraTarget, 5 * delta)

        this.camera.position.copy(this.smoothedCameraPosition)
        this.camera.lookAt(this.smoothedCameraTarget)

        if (this.cameraControls) {
            this.cameraControls.target.copy(this.smoothedCameraTarget)
        }

        if (position.y < -4) {
            this.reset()
        }
    }
}
