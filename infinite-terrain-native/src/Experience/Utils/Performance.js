import { ThreePerf } from 'three-perf'

import Experience from '../Experience.js'

export default class Performance {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.renderer = this.experience.renderer.instance

        this.active = true

        if (this.experience.debug.active) {
            this.panel = new ThreePerf({
                anchorX: 'left',
                anchorY: 'top',
                domElement: document.body,
                renderer: this.renderer,
            })
        }
    }

    // begin() {
    //     this.perf.begin()
    // }

    // end() {
    //     this.perf.end()
    // }

    // destroy() {
    //     this.perf.dispose()
    // }
}
