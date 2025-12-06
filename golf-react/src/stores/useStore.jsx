// useStore.jsx
import { create } from 'zustand'
import * as THREE from 'three'

const TRAIL_CANVAS_SIZE = 256
const TRAIL_PATCH_SIZE = 15

const useStore = create((set) => ({
    ballPosition: new THREE.Vector3(0, 0, 0),
    updateBallPosition: (position) => {
        set({ ballPosition: position.clone() })
    },

    trailTexture: null,
    setTrailTexture: (texture) => {
        set({ trailTexture: texture })
    },

    trailPatchSize: TRAIL_PATCH_SIZE,
    trailTexelSize: 1.0 / TRAIL_CANVAS_SIZE,
}))

export default useStore
