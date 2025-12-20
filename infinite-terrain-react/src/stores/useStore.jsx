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
        color: '#908343', //#8d7d7d //#0c292e
        backgroundColor: '#9a9065', //#a38d8d //#0c1521
        chunkSize: 10,
        segments: 16,
        scale: 0.05,
        amplitude: 2,
    },
    setTerrainParameters: (parameters) => {
        set({ terrainParameters: parameters })
    },

    /**Border parameters */
    borderParameters: {
        noiseStrength: 0.75,
        noiseScale: 0.35,
        circleRadiusFactor: 0.65,
        grassFadeOffset: 3.5,
        groundOffset: -0.75,
        groundFadeOffset: 1.0,
    },
    setBorderParameters: (parameters) => {
        set({ borderParameters: parameters })
    },

    /**
     * Dithering parameters
     */
    ditheringParameters: {
        ditherMode: 'Bayer', // 'Diamond' | 'Bayer'
        pixelSize: 2,
    },
    setDitheringParameters: (parameters) => {
        set({ ditheringParameters: parameters })
    },

    /**
     * Grass parameters
     */
    grassParameters: {
        colorBase: '#669019', //#375da0 //#044537
        colorTop: '#acc125', //#6280a0 //#0d655b
        count: 2500,
        segmentsCount: 4,
        width: 0.15,
        height: 1.15,
        leanFactor: 0.2,
        sobelMode: 2.0,
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
        chunkSize: 256,
        glowSize: 0.18,
        fadeAlpha: 0.1,
        glowAlpha: 0.3,
        showCanvas: false,
    },
    setTrailParameters: (parameters) => {
        set({ trailParameters: parameters })
    },

    /**
     * Ball parameters
     */
    ballParameters: {
        color: '#c7442d', // #3b2ec7
    },
    setBallParameters: (parameters) => {
        set({ ballParameters: parameters })
    },

    /**
     * Performance & Debug parameters
     */
    perfVisible: false,
    setPerfVisible: (visible) => {
        set({ perfVisible: visible })
    },

    physicsDebug: false,
    setPhysicsDebug: (visible) => {
        set({ physicsDebug: visible })
    },

    backgroundWireframe: false,
    setBackgroundWireframe: (visible) => {
        set({ backgroundWireframe: visible })
    },
}))

export default useStore
