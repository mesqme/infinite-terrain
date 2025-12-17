import './style.css'
import ReactDOM from 'react-dom/client'
import { Canvas } from '@react-three/fiber'
import Experience from './world/Experience.jsx'
import { KeyboardControls } from '@react-three/drei'
import { Leva } from 'leva'
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three'
import Loader from './loader/Loader.jsx'

const root = ReactDOM.createRoot(document.querySelector('#root'))

root.render(
    <>
        <KeyboardControls
            map={[
                { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
                { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
                { name: 'leftward', keys: ['ArrowLeft', 'KeyA'] },
                { name: 'rightward', keys: ['ArrowRight', 'KeyD'] },
                { name: 'jump', keys: ['Space'] },
                { name: 'reset', keys: ['Enter'] },
            ]}
        >
            <Canvas
                shadows
                camera={{
                    fov: 45,
                    near: 0.1,
                    far: 200,
                    position: [0, 10, 12],
                }}
            >
                <Experience />
            </Canvas>
            <Leva collapsed />
        </KeyboardControls>
        <Loader />
    </>
)
