import * as THREE from 'three'
import Experience from '../Experience.js'
import vertexShader from '../../shaders/grass/vertex.glsl?raw'
import fragmentShader from '../../shaders/grass/fragment.glsl?raw'

// Constants
const GRASS_SEGMENTS = 6

export default class Grass {
    constructor(
        position = new THREE.Vector3(0, 0, 0),
        size = 4,
        count = 5000,
        width = 0.1,
        height = 0.8
    ) {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.time = this.experience.time
        this.debug = this.experience.debug

        // Check if position is an array or a Vector3
        if (Array.isArray(position)) {
            this.position = new THREE.Vector3(...position)
        } else {
            this.position = position
        }

        this.size = size
        this.count = count
        this.width = width
        this.height = height

        this.setGeometry()
        this.setMaterial()
        this.setMesh()
    }

    setGeometry() {
        const segments = GRASS_SEGMENTS
        const VERTICES = (segments + 1) * 2
        const indices = []

        for (let i = 0; i < segments; ++i) {
            const vi = i * 2
            indices[i * 12 + 0] = vi + 0
            indices[i * 12 + 1] = vi + 1
            indices[i * 12 + 2] = vi + 2

            indices[i * 12 + 3] = vi + 2
            indices[i * 12 + 4] = vi + 1
            indices[i * 12 + 5] = vi + 3

            const fi = VERTICES + vi
            indices[i * 12 + 6] = fi + 2
            indices[i * 12 + 7] = fi + 1
            indices[i * 12 + 8] = fi + 0

            indices[i * 12 + 9] = fi + 3
            indices[i * 12 + 10] = fi + 1
            indices[i * 12 + 11] = fi + 2
        }

        this.geometry = new THREE.InstancedBufferGeometry()
        this.geometry.instanceCount = this.count
        this.geometry.setIndex(indices)
        this.geometry.boundingSphere = new THREE.Sphere(
            new THREE.Vector3(0, 0, 0),
            1 + this.size * 2
        )
    }

    setMaterial() {
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                grassParams: {
                    value: new THREE.Vector4(
                        GRASS_SEGMENTS,
                        this.size,
                        this.width,
                        this.height
                    ),
                },
                time: { value: 0 },
                resolution: {
                    value: new THREE.Vector2(
                        this.experience.sizes.width *
                            this.experience.sizes.pixelRatio,
                        this.experience.sizes.height *
                            this.experience.sizes.pixelRatio
                    ),
                },
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            side: THREE.DoubleSide,
        })
    }

    setMesh() {
        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.position.copy(this.position)
        this.scene.add(this.mesh)
    }

    update() {
        this.material.uniforms.time.value = this.time.elapsed * 0.001
    }
}
