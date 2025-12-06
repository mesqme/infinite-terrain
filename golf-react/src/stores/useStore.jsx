// useStore.jsx
import { create } from 'zustand'
import * as THREE from 'three'

const TRAIL_CANVAS_SIZE = 256
const TRAIL_PATCH_SIZE = 15
const DEFAULT_CAMERA_LERP_SPEED = 5.0

const useStore = create((set) => ({
    ballPosition: new THREE.Vector3(0, 0, 0),
    updateBallPosition: (position) => {
        set({ ballPosition: position.clone() })
    },

    smoothedCircleCenter: new THREE.Vector3(0, 0, 0),
    updateSmoothedCircleCenter: (position) => {
        set({ smoothedCircleCenter: position.clone() })
    },

    cameraLerpSpeed: DEFAULT_CAMERA_LERP_SPEED,
    setCameraLerpSpeed: (speed) => {
        set({ cameraLerpSpeed: speed })
    },

    trailTexture: null,
    setTrailTexture: (texture) => {
        set({ trailTexture: texture })
    },

    trailPatchSize: TRAIL_PATCH_SIZE,
    trailTexelSize: 1.0 / TRAIL_CANVAS_SIZE,
}))

export default useStore
