import { useControls } from 'leva'
import useStore from '../stores/useStore.jsx'

export default function Controls() {
    /**
     * Terrain Chunk parameters
     */
    useControls('Terrain', {
        color: {
            value: useStore.getState().terrainParameters.color,
            onChange: (value) =>
                useStore.setState({
                    terrainParameters: {
                        ...useStore.getState().terrainParameters,
                        color: value,
                    },
                }),
        },
        fadeColor: {
            value: useStore.getState().terrainParameters.fadeColor,
            onChange: (value) =>
                useStore.setState({
                    terrainParameters: {
                        ...useStore.getState().terrainParameters,
                        fadeColor: value,
                    },
                }),
        },
        segments: {
            value: useStore.getState().terrainParameters.segments,
            min: 1,
            max: 100,
            step: 1,
            onChange: (value) =>
                useStore.setState({
                    terrainParameters: {
                        ...useStore.getState().terrainParameters,
                        segments: value,
                    },
                }),
        },
        scale: {
            value: useStore.getState().terrainParameters.scale,
            min: 0,
            max: 1,
            step: 0.01,
            onChange: (value) =>
                useStore.setState({
                    terrainParameters: {
                        ...useStore.getState().terrainParameters,
                        scale: value,
                    },
                }),
        },
        amplitude: {
            value: useStore.getState().terrainParameters.amplitude,
            min: 0,
            max: 10,
            step: 0.1,
            onChange: (value) =>
                useStore.setState({
                    terrainParameters: {
                        ...useStore.getState().terrainParameters,
                        amplitude: value,
                    },
                }),
        },
        chunkSize: {
            value: useStore.getState().terrainParameters.chunkSize,
            min: 2,
            max: 50,
            step: 1,
            onChange: (value) =>
                useStore.setState({
                    terrainParameters: {
                        ...useStore.getState().terrainParameters,
                        chunkSize: value,
                    },
                }),
        },
    })

    /**
     * Border parameters
     */
    useControls('Border', {
        nStrength: {
            value: useStore.getState().borderParameters.noiseStrength,
            min: 0,
            max: 1,
            step: 0.01,
            onChange: (value) =>
                useStore.setState({
                    borderParameters: {
                        ...useStore.getState().borderParameters,
                        noiseStrength: value,
                    },
                }),
        },
        nScale: {
            value: useStore.getState().borderParameters.noiseScale,
            min: 0.01,
            max: 1.0,
            step: 0.01,
            onChange: (value) =>
                useStore.setState({
                    borderParameters: {
                        ...useStore.getState().borderParameters,
                        noiseScale: value,
                    },
                }),
        },
        radius: {
            value: useStore.getState().borderParameters.circleRadiusFactor,
            min: 0.1,
            max: 1.0,
            step: 0.01,
            onChange: (value) =>
                useStore.setState({
                    borderParameters: {
                        ...useStore.getState().borderParameters,
                        circleRadiusFactor: value,
                    },
                }),
        },
        grassFade: {
            value: useStore.getState().borderParameters.grassFadeOffset,
            min: 0,
            max: 4.0,
            step: 0.01,
            onChange: (value) =>
                useStore.setState({
                    borderParameters: {
                        ...useStore.getState().borderParameters,
                        grassFadeOffset: value,
                    },
                }),
        },
        groundOffset: {
            value: useStore.getState().borderParameters.groundOffset,
            min: -2.0,
            max: 2.0,
            step: 0.001,
            onChange: (value) =>
                useStore.setState({
                    borderParameters: {
                        ...useStore.getState().borderParameters,
                        groundOffset: value,
                    },
                }),
        },
        groundFade: {
            value: useStore.getState().borderParameters.groundFadeOffset,
            min: 0,
            max: 1.0,
            step: 0.01,
            onChange: (value) =>
                useStore.setState({
                    borderParameters: {
                        ...useStore.getState().borderParameters,
                        groundFadeOffset: value,
                    },
                }),
        },
    })

    /**
     * Grass parameters
     */
    useControls('Grass', {
        colorBase: {
            value: useStore.getState().grassParameters.colorBase,
            onChange: (value) =>
                useStore.setState({
                    grassParameters: {
                        ...useStore.getState().grassParameters,
                        colorBase: value,
                    },
                }),
        },
        colorTop: {
            value: useStore.getState().grassParameters.colorTop,
            onChange: (value) =>
                useStore.setState({
                    grassParameters: {
                        ...useStore.getState().grassParameters,
                        colorTop: value,
                    },
                }),
        },
        count: {
            value: useStore.getState().grassParameters.count,
            min: 0,
            max: 5000,
            step: 10,
            onChange: (value) =>
                useStore.setState({
                    grassParameters: {
                        ...useStore.getState().grassParameters,
                        count: value,
                    },
                }),
        },
        segments: {
            value: useStore.getState().grassParameters.segmentsCount,
            min: 1,
            max: 10,
            step: 1,
            onChange: (value) =>
                useStore.setState({
                    grassParameters: {
                        ...useStore.getState().grassParameters,
                        segmentsCount: value,
                    },
                }),
        },
        width: {
            value: useStore.getState().grassParameters.width,
            min: 0,
            max: 0.4,
            step: 0.001,
            onChange: (value) =>
                useStore.setState({
                    grassParameters: {
                        ...useStore.getState().grassParameters,
                        width: value,
                    },
                }),
        },
        height: {
            value: useStore.getState().grassParameters.height,
            min: 0,
            max: 3,
            step: 0.01,
            onChange: (value) =>
                useStore.setState({
                    grassParameters: {
                        ...useStore.getState().grassParameters,
                        height: value,
                    },
                }),
        },
        lean: {
            value: useStore.getState().grassParameters.leanFactor,
            min: 0,
            max: 1,
            step: 0.01,
            onChange: (value) =>
                useStore.setState({
                    grassParameters: {
                        ...useStore.getState().grassParameters,
                        leanFactor: value,
                    },
                }),
        },
        sobelMode: {
            options: ['3x3', '2x2'],
            value: useStore.getState().grassParameters.sobelMode,
            onChange: (value) =>
                useStore.setState({
                    grassParameters: {
                        ...useStore.getState().grassParameters,
                        sobelMode: value === '3x3' ? 1.0 : 0.0,
                    },
                }),
        },
        wScale: {
            value: useStore.getState().grassParameters.windScale,
            min: 0,
            max: 1,
            step: 0.01,
            onChange: (value) =>
                useStore.setState({
                    grassParameters: {
                        ...useStore.getState().grassParameters,
                        windScale: value,
                    },
                }),
        },
        wStrength: {
            value: useStore.getState().grassParameters.windStrength,
            min: 0,
            max: 1,
            step: 0.01,
            onChange: (value) =>
                useStore.setState({
                    grassParameters: {
                        ...useStore.getState().grassParameters,
                        windStrength: value,
                    },
                }),
        },
        wSpeed: {
            value: useStore.getState().grassParameters.windSpeed,
            min: 0,
            max: 2,
            step: 0.01,
            onChange: (value) =>
                useStore.setState({
                    grassParameters: {
                        ...useStore.getState().grassParameters,
                        windSpeed: value,
                    },
                }),
        },
    })

    /**
     * Trail parameters
     */
    useControls('Trail', {
        chunkSize: {
            options: [16, 32, 64, 128, 256],
            value: useStore.getState().trailParameters.chunkSize,
            onChange: (value) =>
                useStore.setState({
                    trailParameters: {
                        ...useStore.getState().trailParameters,
                        chunkSize: value,
                    },
                }),
        },
        glowSize: {
            value: useStore.getState().trailParameters.glowSize,
            min: 0,
            max: 0.2,
            step: 0.01,
            onChange: (value) =>
                useStore.setState({
                    trailParameters: {
                        ...useStore.getState().trailParameters,
                        glowSize: value,
                    },
                }),
        },
        fadeAlpha: {
            value: useStore.getState().trailParameters.fadeAlpha,
            min: 0,
            max: 0.5,
            step: 0.01,
            onChange: (value) =>
                useStore.setState({
                    trailParameters: {
                        ...useStore.getState().trailParameters,
                        fadeAlpha: value,
                    },
                }),
        },
        glowAlpha: {
            value: useStore.getState().trailParameters.glowAlpha,
            min: 0,
            max: 1,
            step: 0.01,
            onChange: (value) =>
                useStore.setState({
                    trailParameters: {
                        ...useStore.getState().trailParameters,
                        glowAlpha: value,
                    },
                }),
        },
        showCanvas: {
            value: useStore.getState().trailParameters.showCanvas,
            onChange: (value) =>
                useStore.setState({
                    trailParameters: {
                        ...useStore.getState().trailParameters,
                        showCanvas: value,
                    },
                }),
        },
    })

    /**
     * Ball parameters
     */
    useControls('Ball', {
        color: {
            value: useStore.getState().ballParameters.color,
            onChange: (value) =>
                useStore.setState({
                    ballParameters: {
                        ...useStore.getState().ballParameters,
                        color: value,
                    },
                }),
        },
    })

    return null
}
