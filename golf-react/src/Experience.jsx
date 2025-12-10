import { Physics } from '@react-three/rapier'
import { Perf } from 'r3f-perf'

import Lights from './Lights.jsx'
import Ball from './Ball.jsx'
import Terrain from './Terrain.jsx'
import PostFX from './PostFX.jsx'
import BallTrailCanvas from './BallTrailCanvas.jsx'
import Controls from './Controls.jsx'

export default function Experience() {
    return (
        <>
            <color args={['#9a9065']} attach="background" />

            <Perf position="top-left" />

            <Physics debug={false}>
                <Lights />
                <Terrain />
                <Ball />
            </Physics>

            <BallTrailCanvas />
            <PostFX />
            <Controls />
        </>
    )
}
