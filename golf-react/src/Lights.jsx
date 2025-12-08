import { useRef } from 'react'

export default function Lights() {
    const light = useRef()

    return (
        <>
            <directionalLight
                ref={light}
                castShadow
                position={[4, 10, 1]}
                intensity={4.5}
                shadow-mapSize={[1024, 1024]}
                shadow-camera-near={1}
                shadow-camera-far={10}
                shadow-camera-top={10}
                shadow-camera-right={10}
                shadow-camera-bottom={-10}
                shadow-camera-left={-10}
            />
            <ambientLight intensity={3.5} />
        </>
    )
}
