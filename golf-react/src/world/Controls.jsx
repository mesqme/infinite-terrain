import { useControls } from 'leva'
import useStore from '../stores/useStore.jsx'

export default function Controls() {
    const terrainParameters = useStore((state) => state.terrainParameters)
    const borderParameters = useStore((state) => state.borderParameters)
    const grassParameters = useStore((state) => state.grassParameters)
    const trailParameters = useStore((state) => state.trailParameters)
    const ballParameters = useStore((state) => state.ballParameters)
    const perfVisible = useStore((state) => state.perfVisible)
    const physicsDebug = useStore((state) => state.physicsDebug)
    const backgroundWireframe = useStore((state) => state.backgroundWireframe)

    const setParam = (section, param) => (value) => {
        useStore.setState((state) => ({
            [section]: {
                ...state[section],
                [param]: value,
            },
        }))
    }

    /**
     * General parameters
     */
    useControls('General', {
        perfMonitor: {
            value: perfVisible,
            onChange: (value) => useStore.getState().setPerfVisible(value),
        },
        physicsDebug: {
            value: physicsDebug,
            onChange: (value) => useStore.getState().setPhysicsDebug(value),
        },
        bgWireframe: {
            value: backgroundWireframe,
            onChange: (value) => useStore.getState().setBackgroundWireframe(value),
        },
    })

    /**
     * Terrain Chunk parameters
     */
    useControls('Terrain', {
        color: {
            value: terrainParameters.color,
            onChange: setParam('terrainParameters', 'color'),
        },
        fadeColor: {
            value: terrainParameters.fadeColor,
            onChange: setParam('terrainParameters', 'fadeColor'),
        },
        segments: {
            value: terrainParameters.segments,
            min: 1,
            max: 100,
            step: 1,
            onChange: setParam('terrainParameters', 'segments'),
        },
        scale: {
            value: terrainParameters.scale,
            min: 0,
            max: 1,
            step: 0.01,
            onChange: setParam('terrainParameters', 'scale'),
        },
        amplitude: {
            value: terrainParameters.amplitude,
            min: 0,
            max: 10,
            step: 0.1,
            onChange: setParam('terrainParameters', 'amplitude'),
        },
        chunkSize: {
            value: terrainParameters.chunkSize,
            min: 2,
            max: 50,
            step: 1,
            onChange: setParam('terrainParameters', 'chunkSize'),
        },
    })

    /**
     * Border parameters
     */
    useControls('Border', {
        nStrength: {
            value: borderParameters.noiseStrength,
            min: 0,
            max: 1,
            step: 0.01,
            onChange: setParam('borderParameters', 'noiseStrength'),
        },
        nScale: {
            value: borderParameters.noiseScale,
            min: 0.01,
            max: 1.0,
            step: 0.01,
            onChange: setParam('borderParameters', 'noiseScale'),
        },
        radius: {
            value: borderParameters.circleRadiusFactor,
            min: 0.1,
            max: 1.0,
            step: 0.01,
            onChange: setParam('borderParameters', 'circleRadiusFactor'),
        },
        grassFade: {
            value: borderParameters.grassFadeOffset,
            min: 0,
            max: 4.0,
            step: 0.01,
            onChange: setParam('borderParameters', 'grassFadeOffset'),
        },
        groundOffset: {
            value: borderParameters.groundOffset,
            min: -2.0,
            max: 2.0,
            step: 0.001,
            onChange: setParam('borderParameters', 'groundOffset'),
        },
        groundFade: {
            value: borderParameters.groundFadeOffset,
            min: 0,
            max: 1.0,
            step: 0.01,
            onChange: setParam('borderParameters', 'groundFadeOffset'),
        },
    })

    /**
     * Grass parameters
     */
    useControls('Grass', {
        colorBase: {
            value: grassParameters.colorBase,
            onChange: setParam('grassParameters', 'colorBase'),
        },
        colorTop: {
            value: grassParameters.colorTop,
            onChange: setParam('grassParameters', 'colorTop'),
        },
        count: {
            value: grassParameters.count,
            min: 0,
            max: 5000,
            step: 10,
            onChange: setParam('grassParameters', 'count'),
        },
        segments: {
            value: grassParameters.segmentsCount,
            min: 1,
            max: 10,
            step: 1,
            onChange: setParam('grassParameters', 'segmentsCount'),
        },
        width: {
            value: grassParameters.width,
            min: 0,
            max: 0.4,
            step: 0.001,
            onChange: setParam('grassParameters', 'width'),
        },
        height: {
            value: grassParameters.height,
            min: 0,
            max: 3,
            step: 0.01,
            onChange: setParam('grassParameters', 'height'),
        },
        lean: {
            value: grassParameters.leanFactor,
            min: 0,
            max: 1,
            step: 0.01,
            onChange: setParam('grassParameters', 'leanFactor'),
        },
        sobelMode: {
            options: ['3x3', '2x2'],
            value: grassParameters.sobelMode === 1.0 ? '3x3' : '2x2',
            onChange: (value) => setParam('grassParameters', 'sobelMode')(value === '3x3' ? 1.0 : 0.0),
        },
        wScale: {
            value: grassParameters.windScale,
            min: 0,
            max: 1,
            step: 0.01,
            onChange: setParam('grassParameters', 'windScale'),
        },
        wStrength: {
            value: grassParameters.windStrength,
            min: 0,
            max: 1,
            step: 0.01,
            onChange: setParam('grassParameters', 'windStrength'),
        },
        wSpeed: {
            value: grassParameters.windSpeed,
            min: 0,
            max: 2,
            step: 0.01,
            onChange: setParam('grassParameters', 'windSpeed'),
        },
    })

    /**
     * Trail parameters
     */
    useControls('Trail', {
        chunkSize: {
            options: [16, 32, 64, 128, 256],
            value: trailParameters.chunkSize,
            onChange: setParam('trailParameters', 'chunkSize'),
        },
        glowSize: {
            value: trailParameters.glowSize,
            min: 0,
            max: 0.2,
            step: 0.01,
            onChange: setParam('trailParameters', 'glowSize'),
        },
        fadeAlpha: {
            value: trailParameters.fadeAlpha,
            min: 0,
            max: 0.5,
            step: 0.01,
            onChange: setParam('trailParameters', 'fadeAlpha'),
        },
        glowAlpha: {
            value: trailParameters.glowAlpha,
            min: 0,
            max: 1,
            step: 0.01,
            onChange: setParam('trailParameters', 'glowAlpha'),
        },
        showCanvas: {
            value: trailParameters.showCanvas,
            onChange: setParam('trailParameters', 'showCanvas'),
        },
    })

    /**
     * Ball parameters
     */
    useControls('Ball', {
        color: {
            value: ballParameters.color,
            onChange: setParam('ballParameters', 'color'),
        },
    })

    return null
}
