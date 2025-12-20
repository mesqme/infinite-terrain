import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'

import useStore from '../stores/useStore.jsx'

export default function BackgroundSphere({ color }) {
    const meshRef = useRef()
    const backgroundWireframe = useStore((state) => state.backgroundWireframe)

    useFrame(() => {
        const ballPosition = useStore.getState().ballPosition
        meshRef.current.position.copy(ballPosition)
    })

    return (
        <mesh ref={meshRef}>
            <sphereGeometry args={[50]} />
            {backgroundWireframe ? <meshBasicMaterial color="red" side={THREE.BackSide} wireframe /> : <meshBasicMaterial color={color} side={THREE.BackSide} />}
        </mesh>
    )
}
