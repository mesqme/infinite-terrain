import Experience from '../Experience.js'
import Environment from './Environment.js'
// import Floor from './Floor.js'
// import Fox from './Fox.js'
// import Grass from './Grass.js'
import Terrain from './Terrain.js'
import Ball from './Ball.js'

export default class World {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.resources = this.experience.resources

        // Wait for resources
        this.resources.on('ready', () => {
            // Setup
            // this.floor = new Floor()
            // this.fox = new Fox()
            // this.grass = new Grass()
            this.ball = new Ball()
            this.terrain = new Terrain()
            this.environment = new Environment()
        })
    }

    update() {
        if (this.fox) this.fox.update()
        if (this.ball) this.ball.update()
        if (this.terrain) this.terrain.update()
    }
}
