import Experience from '../Experience.js'
import RAPIER from '@dimforge/rapier3d'

export default class Physics {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.time = this.experience.time

        this.world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 })
    }

    update() {
        this.world.step()
    }
}
