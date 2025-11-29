import * as THREE from 'three'
import Experience from '../Experience.js'
import vertexShader from '../../shaders/grass/vertex.glsl?raw'
import fragmentShader from '../../shaders/grass/fragment.glsl?raw'

export default class Grass {
    constructor(position = [0, 0, 0]) {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.time = this.experience.time
        this.debug = this.experience.debug

        this.position = new THREE.Vector3(...position)

        this.params = {
            width: 0.15,
            height: 0.8,
            segments: 5,
            size: 4,
            count: 5000,
        }

        this.setGeometry()
        this.setMaterial()
        this.setMesh()
        this.setParams()
    }

    setGeometry() {
        const segments = this.params.segments
        const vertices = (segments + 1) * 2
        const indices = []

        for (let i = 0; i < segments; ++i) {
            const vi = i * 2
            indices[i * 12 + 0] = vi + 0
            indices[i * 12 + 1] = vi + 1
            indices[i * 12 + 2] = vi + 2

            indices[i * 12 + 3] = vi + 2
            indices[i * 12 + 4] = vi + 1
            indices[i * 12 + 5] = vi + 3

            const fi = vertices + vi
            indices[i * 12 + 6] = fi + 2
            indices[i * 12 + 7] = fi + 1
            indices[i * 12 + 8] = fi + 0

            indices[i * 12 + 9] = fi + 3
            indices[i * 12 + 10] = fi + 1
            indices[i * 12 + 11] = fi + 2
        }

        this.geometry = new THREE.InstancedBufferGeometry()
        this.geometry.instanceCount = this.params.count
        this.geometry.setIndex(indices)
        this.geometry.boundingSphere = new THREE.Sphere(
            new THREE.Vector3(0, 0, 0),
            1 + this.params.size * 2
        )
    }

    setMaterial() {
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                grassParams: {
                    value: new THREE.Vector4(
                        this.params.segments,
                        this.params.size,
                        this.params.width,
                        this.params.height
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

    // Debug
    setParams() {
        if (this.debug.active) {
            this.debugFolder = this.debug.pane.addFolder({ title: 'grass' })

            this.debugFolder
                .addBinding(this.params, 'width', {
                    min: 0.01,
                    max: 0.5,
                    step: 0.001,
                })
                .on('change', () => this.updateParams())

            this.debugFolder
                .addBinding(this.params, 'height', {
                    min: 0.1,
                    max: 3,
                    step: 0.01,
                })
                .on('change', () => this.updateParams())
        }
    }

    updateParams() {
        this.material.uniforms.grassParams.value.z = this.params.width
        this.material.uniforms.grassParams.value.w = this.params.height
    }

    update() {
        this.material.uniforms.time.value = this.time.elapsed * 0.001
    }
}
