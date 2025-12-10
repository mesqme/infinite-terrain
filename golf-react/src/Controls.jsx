import { useControls } from 'leva'
import useStore from './stores/useStore.jsx'

export default function Controls() {
    /**
     * Border parameters
     */
    useControls('Border', {
        nStrength: {
            value: 0.75,
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
            value: 3.5,
            min: 0.1,
            max: 10,
            step: 0.1,
            onChange: (value) =>
                useStore.setState({
                    borderParameters: {
                        ...useStore.getState().borderParameters,
                        noiseScale: value,
                    },
                }),
        },
        radius: {
            value: 0.5,
            min: 0.1,
            max: 1,
            step: 0.01,
            onChange: (value) =>
                useStore.setState({
                    borderParameters: {
                        ...useStore.getState().borderParameters,
                        circleRadiusFactor: value,
                    },
                }),
        },
    })

    /**
     * Grass parameters
     */
    useControls('Grass', {
        colorBase: {
            value: '#669019',
            onChange: (value) =>
                useStore.setState({
                    grassParameters: {
                        ...useStore.getState().grassParameters,
                        colorBase: value,
                    },
                }),
        },
        colorTop: {
            value: '#acc125',
            onChange: (value) =>
                useStore.setState({
                    grassParameters: {
                        ...useStore.getState().grassParameters,
                        colorTop: value,
                    },
                }),
        },
        count: {
            value: 1900,
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
            value: 4,
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
            value: 0.15,
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
            value: 1.15,
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
            value: 0.2,
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
            onChange: (value) =>
                useStore.setState({
                    grassParameters: {
                        ...useStore.getState().grassParameters,
                        sobelMode: value === '3x3' ? 1.0 : 0.0,
                    },
                }),
        },
        wScale: {
            value: 0.35,
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
            value: 0.7,
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
            value: 1.0,
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
        canvasSize: {
            options: [16, 32, 64, 128, 256],
            value: useStore.getState().trailParameters.canvasSize,
            onChange: (value) =>
                useStore.setState({
                    trailParameters: {
                        ...useStore.getState().trailParameters,
                        canvasSize: value,
                    },
                }),
        },
        patchSize: {
            value: useStore.getState().trailParameters.patchSize,
            min: 1,
            max: 100,
            step: 1,
            onChange: (value) =>
                useStore.setState({
                    trailParameters: {
                        ...useStore.getState().trailParameters,
                        patchSize: value,
                    },
                }),
        },
        glowSize: {
            value: useStore.getState().trailParameters.glowSize,
            min: 0,
            max: 1,
            step: 0.01,
            onChange: (value) =>
                useStore.setState({
                    trailParameters: {
                        ...useStore.getState().trailParameters,
                        glowSize: value,
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
            value: '#c7442d',
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
