import { useRapier, RigidBody } from '@react-three/rapier'
import { useFrame } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'
import { useState, useEffect, useRef, useMemo } from 'react'
import * as THREE from 'three'
import { gsap } from 'gsap'

import useStore from '../stores/useStore.jsx'
import usePhases, { PHASES } from '../stores/usePhases.jsx'

const BALL_RADIUS = 0.4
const GROUND_GAP = 0.05 // remember to keep it below the time of impact threshold
const TIME_OF_IMPACT_THRESHOLD = 0.15
const CAMERA_POSITION_OFFSET = new THREE.Vector3(0, 10, 12)
const CAMERA_TARGET_OFFSET = new THREE.Vector3(0, 0.25, 0)
const CAMERA_LERP_SPEED = 5.0
const BALL_INITIAL_POSITION = new THREE.Vector3(0, 4, 0)
const BALL_RESET_Y = -4.0
const PHYSICS_PARAMS = { jumpForce: 2.0, impulseStrength: 1.8, torqueStrength: 0.5 }

export default function Ball() {
    const ballColor = useStore((state) => state.ballParameters.color)
    const setBallPosition = useStore((state) => state.setBallPosition)
    const setLandBallDistance = useStore((state) => state.setLandBallDistance)
    const setSmoothedCircleCenter = useStore((state) => state.setSmoothedCircleCenter)
    const phase = usePhases((state) => state.phase)

    const [smoothedCameraPosition] = useState(() => new THREE.Vector3(0, 14, 12))
    const [smoothedCameraTarget] = useState(() => new THREE.Vector3(0, 0.25, 0))
    const [smoothedCircleCenter] = useState(() => new THREE.Vector3(0, 0, 0))

    const [subscribeKeys, getKeys] = useKeyboardControls()
    const { rapier, world } = useRapier()

    const bodyRef = useRef()
    const downRayRef = useRef()
    const meshRef = useRef()
    const scaleAnimationRef = useRef(null)

    // Geometry
    const geometry = useMemo(() => {
        return new THREE.IcosahedronGeometry(BALL_RADIUS, 1)
    }, [])

    // Material
    const material = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            color: new THREE.Color(ballColor),
            flatShading: true,
        })
    }, []) // Create once

    // Update material color when it changes
    useEffect(() => {
        material.color.set(ballColor)
    }, [ballColor, material])

    const castDownRay = () => {
        // Optimization: Initialize ray only once
        if (!downRayRef.current) {
            downRayRef.current = new rapier.Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: -1, z: 0 })
        }

        const ray = downRayRef.current
        const origin = ray.origin
        const bodyPosition = bodyRef.current.translation()

        origin.x = bodyPosition.x
        origin.y = bodyPosition.y - (BALL_RADIUS - GROUND_GAP)
        origin.z = bodyPosition.z

        const hit = world.castRay(ray, 10, false, undefined, undefined, undefined, undefined, (collider) => {
            const selfHandle = bodyRef.current.handle
            return collider.handle !== selfHandle
        })

        return hit
    }

    const resetPosition = () => {
        bodyRef.current.setTranslation(BALL_INITIAL_POSITION, true)
        bodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
        bodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true)
    }

    const handleReset = () => {
        // Reset ball position
        resetPosition()

        // Kill previous animation if it exists
        if (scaleAnimationRef.current) {
            scaleAnimationRef.current.kill()
            scaleAnimationRef.current = null
        }

        // Animate ball scale from 0 with elastic easing
        if (meshRef.current) {
            // Set scale to 0 first
            meshRef.current.scale.set(0, 0, 0)

            // Create and store new animation
            scaleAnimationRef.current = gsap.to(meshRef.current.scale, {
                x: 1,
                y: 1,
                z: 1,
                duration: 0.8,
                ease: 'elastic.out(1, 0.5)',
                onComplete: () => {
                    scaleAnimationRef.current = null
                },
            })
        }
    }

    const jump = () => {
        const hit = castDownRay()
        if (hit && hit.timeOfImpact < TIME_OF_IMPACT_THRESHOLD) {
            bodyRef.current.applyImpulse({ x: 0, y: PHYSICS_PARAMS.jumpForce, z: 0 })
        }
    }

    useEffect(() => {
        const unsubscribeJump = subscribeKeys(
            (state) => state.jump,
            (value) => {
                if (value) jump()
            }
        )

        const unsubscribeReset = subscribeKeys(
            (state) => state.reset,
            (value) => {
                if (value) handleReset()
            }
        )

        // Also subscribe to store jump for UI controls
        const unsubscribeStore = useStore.subscribe(
            (state) => state.controls.jump,
            (value) => {
                if (value) jump()
            }
        )

        return () => {
            unsubscribeJump()
            unsubscribeReset()
            unsubscribeStore()
            // Cleanup: kill any running animations
            if (scaleAnimationRef.current) {
                scaleAnimationRef.current.kill()
                scaleAnimationRef.current = null
            }
        }
    }, [])

    // Listen for game start trigger from Loader
    useEffect(() => {
        if (phase === PHASES.start) {
            handleReset()
        }
    }, [phase])

    useFrame((state, delta) => {
        const safeDelta = Math.min(delta, 0.1)

        // Controls
        const { forward, backward, leftward, rightward } = getKeys()
        const storeControls = useStore.getState().controls

        const impulse = { x: 0, y: 0, z: 0 }
        const torque = { x: 0, y: 0, z: 0 }

        const impulseStrength = PHYSICS_PARAMS.impulseStrength * safeDelta
        const torqueStrength = PHYSICS_PARAMS.torqueStrength * safeDelta

        if (forward || storeControls.forward) {
            impulse.z -= impulseStrength
            torque.x -= torqueStrength
        }

        if (rightward || storeControls.rightward) {
            impulse.x += impulseStrength
            torque.z -= torqueStrength
        }

        if (backward || storeControls.backward) {
            impulse.z += impulseStrength
            torque.x += torqueStrength
        }

        if (leftward || storeControls.leftward) {
            impulse.x -= impulseStrength
            torque.z += torqueStrength
        }

        bodyRef.current.applyImpulse(impulse)
        bodyRef.current.applyTorqueImpulse(torque)

        const bodyPosition = bodyRef.current.translation()
        setBallPosition(bodyPosition)

        // Reset position if the ball falls below -4 on Y
        if (bodyPosition.y < BALL_RESET_Y) {
            resetPosition()
        }

        // Raycasting
        const hit = castDownRay()
        setLandBallDistance(hit ? hit.timeOfImpact : 10.0) // handle no hit situation

        // Smooth camera and circle center
        const cameraPosition = new THREE.Vector3()
        cameraPosition.copy(bodyPosition)
        cameraPosition.add(CAMERA_POSITION_OFFSET)

        const cameraTarget = new THREE.Vector3()
        cameraTarget.copy(bodyPosition)
        cameraTarget.add(CAMERA_TARGET_OFFSET)

        const circleCenter = new THREE.Vector3()
        circleCenter.copy(bodyPosition)

        const lerpFactor = CAMERA_LERP_SPEED * safeDelta
        smoothedCameraPosition.lerp(cameraPosition, lerpFactor)
        smoothedCameraTarget.lerp(cameraTarget, lerpFactor)
        smoothedCircleCenter.lerp(circleCenter, lerpFactor)

        state.camera.position.copy(smoothedCameraPosition)
        state.camera.lookAt(smoothedCameraTarget)
        setSmoothedCircleCenter(smoothedCircleCenter)
    })

    return (
        <RigidBody
            ref={bodyRef}
            canSleep={false}
            colliders="ball"
            restitution={0.2}
            friction={1}
            linearDamping={0.5}
            angularDamping={0.5}
            position={[0, 2, 0]}
            userData={{ name: 'ball' }}
        >
            <mesh ref={meshRef} geometry={geometry} material={material} />
        </RigidBody>
    )
}
