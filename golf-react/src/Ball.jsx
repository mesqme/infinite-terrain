import { useRapier, RigidBody } from '@react-three/rapier'
import { useFrame } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'
import { useState, useEffect, useRef } from 'react'
import { useControls } from 'leva'
import * as THREE from 'three'

import useStore from './stores/useStore.jsx'

const RAYCASTER_ORIGIN_Y_OFFSET = 0.35

export default function Ball() {
    const controls = useControls('Ball', {
        color: '#565893',
    })

    const body = useRef()
    const [subscribeKeys, getKeys] = useKeyboardControls()
    const { rapier, world } = useRapier()
    const [smoothedCameraPosition] = useState(
        () => new THREE.Vector3(10, 10, 10)
    )
    const [smoothedCameraTarget] = useState(() => new THREE.Vector3())
    const [smoothedCircleCenter] = useState(() => new THREE.Vector3(0, 0, 0))
    const updateBallPosition = useStore((state) => state.updateBallPosition)
    const updateSmoothedCircleCenter = useStore(
        (state) => state.updateSmoothedCircleCenter
    )
    const cameraLerpSpeed = useStore((state) => state.cameraLerpSpeed)
    const setLandBallDistance = useStore((state) => state.setLandBallDistance)

    const jump = () => {
        if (!body.current) return

        // Start the ray slightly inside the ball and ignore the ball collider itself
        const origin = body.current.translation()
        origin.y -= RAYCASTER_ORIGIN_Y_OFFSET
        const direction = { x: 0, y: -1, z: 0 }
        const ray = new rapier.Ray(origin, direction)

        const hit = world.castRay(
            ray,
            10,
            false,
            undefined,
            undefined,
            undefined,
            undefined,
            (collider) => {
                // Exclude the ball rigid body from ray detection
                return collider.parent()?.userData?.name !== 'ball'
            }
        )

        if (hit && hit.timeOfImpact < 0.15) {
            body.current.applyImpulse({ x: 0, y: 2.0, z: 0 })
        }
    }

    const resetPosition = () => {
        body.current.setTranslation({ x: 0, y: 4, z: 0 }, true)
        body.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
        body.current.setAngvel({ x: 0, y: 0, z: 0 }, true)
    }

    useEffect(() => {
        const unsubscribeJump = subscribeKeys(
            (state) => state.jump,
            (value) => {
                if (value) jump()
            }
        )

        return () => {
            unsubscribeJump()
        }
    }, [])

    useFrame((state, delta) => {
        /**
         * Controls
         */
        const { forward, backward, leftward, rightward } = getKeys()

        const impulse = { x: 0, y: 0, z: 0 }
        const torque = { x: 0, y: 0, z: 0 }

        const impulseStrength = 1.8 * delta
        const torqueStrength = 0.5 * delta

        if (forward) {
            impulse.z -= impulseStrength
            torque.x -= torqueStrength
        }

        if (rightward) {
            impulse.x += impulseStrength
            torque.z -= torqueStrength
        }

        if (backward) {
            impulse.z += impulseStrength
            torque.x += torqueStrength
        }

        if (leftward) {
            impulse.x -= impulseStrength
            torque.z += torqueStrength
        }

        body.current.applyImpulse(impulse)
        body.current.applyTorqueImpulse(torque)

        /**
         * Raycast to ground to get distance
         */
        const bodyPosition = body.current.translation()
        const origin = {
            x: bodyPosition.x,
            y: bodyPosition.y,
            z: bodyPosition.z,
        }
        origin.y -= RAYCASTER_ORIGIN_Y_OFFSET
        const direction = { x: 0, y: -1, z: 0 }
        const ray = new rapier.Ray(origin, direction)

        const hit = world.castRay(
            ray,
            10,
            false,
            undefined,
            undefined,
            undefined,
            undefined,
            (collider) => {
                // Exclude the ball rigid body from ray detection
                return collider.parent()?.userData?.name !== 'ball'
            }
        )

        // Update land distance in store
        if (hit) {
            setLandBallDistance(hit.timeOfImpact)
        } else {
            // If no hit, set to a large distance (glow will be off)
            setLandBallDistance(10.0)
        }

        /**
         * Camera
         */

        // Update ball position in store
        updateBallPosition(
            new THREE.Vector3(bodyPosition.x, bodyPosition.y, bodyPosition.z)
        )

        // If the ball falls below -4 on Y, reset it to the initial height (y = 2)
        if (bodyPosition.y < -4) {
            resetPosition()
        }

        const cameraPosition = new THREE.Vector3()
        cameraPosition.copy(bodyPosition)
        // cameraPosition.z += 20.25
        // cameraPosition.y += 15.65
        cameraPosition.z += 12.0
        cameraPosition.y += 10.0
        // cameraPosition.z += 6.0
        // cameraPosition.y += 6.0

        const cameraTarget = new THREE.Vector3()
        cameraTarget.copy(bodyPosition)
        cameraTarget.y += 0.25

        // Lerp camera and circle center with the same speed
        const lerpFactor = cameraLerpSpeed * delta
        smoothedCameraPosition.lerp(cameraPosition, lerpFactor)
        smoothedCameraTarget.lerp(cameraTarget, lerpFactor)

        // Smooth the circle center toward ball position (same lerp as camera)
        smoothedCircleCenter.lerp(bodyPosition, lerpFactor)
        updateSmoothedCircleCenter(smoothedCircleCenter)

        state.camera.position.copy(smoothedCameraPosition)
        state.camera.lookAt(smoothedCameraTarget)
    })

    return (
        <RigidBody
            ref={body}
            name="ball"
            canSleep={false}
            colliders="ball"
            restitution={0.2}
            friction={1}
            linearDamping={0.5}
            angularDamping={0.5}
            position={[0, 2, 0]}
            userData={{ name: 'ball' }}
        >
            <mesh castShadow>
                <icosahedronGeometry args={[0.4, 1]} />
                <meshStandardMaterial flatShading color={controls.color} />
            </mesh>
        </RigidBody>
    )
}
