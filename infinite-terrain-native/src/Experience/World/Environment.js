import * as THREE from 'three'
import Experience from '../Experience.js'

export default class Environment {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.debug = this.experience.debug

        this.sunOffset = new THREE.Vector3(3.5, 2, -1.25)

        // Debug
        if (this.debug.active) {
            this.debugFolder = this.debug.pane.addFolder({
                title: 'environment',
            })
        }

        this.setSunLight()
        this.setEnvironmentMap()
    }

    setSunLight() {
        this.sunLight = new THREE.DirectionalLight('#ffffff', 4)
        this.sunLight.castShadow = true
        this.sunLight.shadow.camera.far = 15
        this.sunLight.shadow.mapSize.set(1024, 1024)
        this.sunLight.shadow.normalBias = 0.05
        this.sunLight.position.copy(this.sunOffset)
        this.scene.add(this.sunLight)
        this.scene.add(this.sunLight.target)

        // Debug
        if (this.debug.active) {
            this.debugFolder.addBinding(this.sunLight, 'intensity', {
                label: 'sunInt',
                min: 0,
                max: 10,
                step: 0.001,
            })

            this.debugFolder.addBinding(this.sunOffset, 'x', {
                label: 'sunPos X',
                min: -5,
                max: 5,
                step: 0.001,
            })

            this.debugFolder.addBinding(this.sunOffset, 'y', {
                label: 'sunPos Y',
                min: -5,
                max: 5,
                step: 0.001,
            })

            this.debugFolder.addBinding(this.sunOffset, 'z', {
                label: 'sunPos Z',
                min: -5,
                max: 5,
                step: 0.001,
            })
        }
    }

    setEnvironmentMap() {
        this.environmentMap = {}
        this.environmentMap.intensity = 0.4
        this.environmentMap.texture = this.resources.items.environmentMapTexture
        this.environmentMap.texture.colorSpace = THREE.SRGBColorSpace

        this.scene.environment = this.environmentMap.texture

        this.environmentMap.updateMaterials = () => {
            this.scene.traverse((child) => {
                if (
                    child instanceof THREE.Mesh &&
                    child.material instanceof THREE.MeshStandardMaterial
                ) {
                    child.material.envMap = this.environmentMap.texture
                    child.material.envMapIntensity =
                        this.environmentMap.intensity
                    child.material.needsUpdate = true
                }
            })
        }
        this.environmentMap.updateMaterials()

        // Debug
        if (this.debug.active) {
            this.debugFolder
                .addBinding(this.environmentMap, 'intensity', {
                    label: 'envInt',
                    min: 0,
                    max: 4,
                    step: 0.001,
                })
                .on('change', () => this.environmentMap.updateMaterials())
        }
    }

    update() {
        if (this.experience.world.ball) {
            const ballPosition = this.experience.world.ball.mesh.position
            this.sunLight.position.copy(ballPosition).add(this.sunOffset)
            this.sunLight.target.position.copy(ballPosition)
        }
    }
}
