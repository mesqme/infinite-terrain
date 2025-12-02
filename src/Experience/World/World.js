import Experience from '../Experience.js'
import Environment from './Environment.js'
import Terrain from './Terrain.js'
import Ball from './Ball.js'

export default class World {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.resources = this.experience.resources

        // Wait for resources
        this.resources.on('ready', () => {
            this.ball = new Ball()
            this.terrain = new Terrain()
            this.environment = new Environment()
        })
    }

    update() {
        if (this.ball) this.ball.update()
        if (this.terrain) this.terrain.update()
        if (this.environment) this.environment.update()
    }
}
