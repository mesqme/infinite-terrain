import * as THREE from 'three'
import useStore from '../stores/useStore.jsx'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
export default function BackgroundSphere() {
    const meshRef = useRef()
    useFrame(() => {
        const ballPosition = useStore.getState().ballPosition
        meshRef.current.position.copy(ballPosition)
    })
    return (
        <mesh ref={meshRef}>
            <sphereGeometry args={[50]} />
            <meshBasicMaterial color="#9a9065" side={THREE.BackSide} />
        </mesh>
    )
}
