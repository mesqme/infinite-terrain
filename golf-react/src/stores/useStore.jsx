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

    // Noise parameters for irregular edge (shared between grass and ground)
    noiseStrength: 0.75,
    setNoiseStrength: (strength) => {
        set({ noiseStrength: strength })
    },

    noiseScale: 3.5,
    setNoiseScale: (scale) => {
        set({ noiseScale: scale })
    },

    // Circle radius factor (multiplier for uTrailPatchSize to get the bounding circle radius)
    circleRadiusFactor: 0.5,
    setCircleRadiusFactor: (factor) => {
        set({ circleRadiusFactor: factor })
    },

    // Distance from ball to ground (from raycaster)
    landBallDistance: 1.0,
    setLandBallDistance: (distance) => {
        set({ landBallDistance: distance })
    },
}))

export default useStore
