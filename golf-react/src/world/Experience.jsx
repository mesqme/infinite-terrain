import { Physics } from '@react-three/rapier'
import { Perf } from 'r3f-perf'

import Lights from './Lights.jsx'
import Ball from './Ball.jsx'
import Terrain from './Terrain.jsx'
import BallTrailCanvas from './BallTrailCanvas.jsx'
import Controls from './Controls.jsx'
import BackgroundSphere from './BackgroundSphere.jsx'
import useStore from '../stores/useStore.jsx'

export default function Experience() {
    const perfVisible = useStore((state) => state.perfVisible)
    const physicsDebug = useStore((state) => state.physicsDebug)

    return (
        <>
            <color args={['#9a9065']} attach="background" />

            {perfVisible && <Perf position="top-left" />}

            <Physics debug={physicsDebug}>
                <Lights />
                <Terrain />
                <Ball />
            </Physics>

            <BallTrailCanvas />
            <Controls />
            <BackgroundSphere />
        </>
    )
}
