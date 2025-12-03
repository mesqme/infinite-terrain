import { Pane } from 'tweakpane'

export default class Debug {
    constructor() {
        // this.active = window.location.hash === '#debug'
        this.active = true

        if (this.active) {
            this.pane = new Pane()
        }
    }
}
