import { create } from 'zustand'
import * as THREE from 'three'

const useStore = create((set) => ({
    trailTexture: null,
    setTrailTexture: (texture) => {
        set({ trailTexture: texture })
    },

    ballPosition: new THREE.Vector3(0, 0, 0),
    setBallPosition: (position) => {
        set({ ballPosition: position })
    },

    smoothedCircleCenter: new THREE.Vector3(0, 0, 0),
    setSmoothedCircleCenter: (position) => {
        set({ smoothedCircleCenter: position })
    },

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
        showCanvas: false,
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
