import { ThreePerf } from 'three-perf'

import Experience from '../Experience.js'

export default class Performance {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.renderer = this.experience.renderer.instance

        if (this.experience.debug.active) {
            this.perf = new ThreePerf({
                anchorX: 'left',
                anchorY: 'top',
                domElement: document.body,
                renderer: this.renderer,
            })
        }
    }

    begin() {
        if (this.perf) this.perf.begin()
    }

    end() {
        if (this.perf) this.perf.end()
    }

    destroy() {
        if (this.perf) this.perf.dispose()
    }
}
