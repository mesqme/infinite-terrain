// useStore.jsx
import { create } from 'zustand'
import * as THREE from 'three'

const DEFAULT_CAMERA_LERP_SPEED = 5.0

const DEFAULT_TRAIL_PARAMETERS = {
    canvasSize: 256,
    patchSize: 15,
    glowSize: 0.12,
    showCanvas: false, // Control visibility of the debug canvas on screen
}

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

    // Distance from ball to ground (from raycaster)
    landBallDistance: 1.0,
    setLandBallDistance: (distance) => {
        set({ landBallDistance: distance })
    },

    /**
     * Terrain parameters
     */
    terrainParameters: {
        color: '#908343',
        fadeColor: '#9a9065',
        segments: 32,
        scale: 0.05,
        amplitude: 2,
    },
    setTerrainParameters: (parameters) => {
        set({ terrainParameters: parameters })
    },

    /**Border parameters */
    borderParameters: {
        noiseStrength: 0.75,
        noiseScale: 3.5,
        circleRadiusFactor: 0.5,
    },
    setBorderParameters: (parameters) => {
        set({ borderParameters: parameters })
    },

    /**
     * Grass parameters
     */
    grassParameters: {
        colorBase: '#669019',
        colorTop: '#acc125',
        count: 1900,
        segmentsCount: 4,
        width: 0.15,
        height: 1.15,
        leanFactor: 0.2,
        sobelMode: '3x3',
        windScale: 0.35,
        windStrength: 0.7,
        windSpeed: 1.0,
    },
    setGrassParameters: (parameters) => {
        set({ grassParameters: parameters })
    },

    /**
     * Trail parameters
     */
    trailParameters: {
        canvasSize: 256,
        patchSize: 15,
        glowSize: 0.12,
        fadeAlpha: 0.1,
        glowAlpha: 0.4,
        showCanvas: true,
    },
    setTrailParameters: (parameters) => {
        set({ trailParameters: parameters })
    },

    /**
     * Ball parameters
     */
    ballParameters: {
        color: '#c7442d',
    },
    setBallParameters: (parameters) => {
        set({ ballParameters: parameters })
    },
}))

export default useStore
