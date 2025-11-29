import { useRapier, RigidBody } from '@react-three/rapier'
import { useFrame } from '@react-three/fiber'
import { Text, useKeyboardControls } from '@react-three/drei'
import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'

import useGame from '../stores/useGame.tsx'

type Props = {
  nodes: any
  material: THREE.MeshStandardMaterial | THREE.MeshBasicMaterial
}

// @ts-ignore
const CAMERA_POSITION = new THREE.Vector3(0, 7, 10)
const RAYCASTER_ORIGIN_Y_OFFSET = 0.71275 / 2 - 0.02

const PHYSICS_FORCE = {
  jump: 1.5,
  impulse: 2.3,
  torque: 0.3,
}

const Player = (props: Props) => {
  const { nodes, material } = props

  const body = useRef<any>(null)
  const textRef = useRef<any>(null)
  // @ts-ignore
  const [playerName, setPlayerName] = useState(() => 'unknown')

  const [subscribeKeys, getKeys] = useKeyboardControls()
  const { rapier, world } = useRapier()

  // @ts-ignore
  const [smoothedCameraPosition] = useState(() => new THREE.Vector3(0, 7, 10))
  // @ts-ignore
  const [smoothedCameraTarget] = useState(() => new THREE.Vector3())
  // @ts-ignore
  const [smoothedTextPosition] = useState(() => new THREE.Vector3())

  const start = useGame((state) => state.start)
  const restart = useGame((state) => state.restart)
  const updatePlayerPosition = useGame((state) => state.updatePlayerPosition)
  // const updatePlayerImpulse = useGame((state) => state.updatePlayerImpulse)
  const updatePlayerGrassDistance = useGame((state) => state.updatePlayerGrassDistance)

  const jump = () => {
    body.current.wakeUp()
    const origin = body.current.translation()
    // Ray origin is slightly always inside the ball
    origin.y -= RAYCASTER_ORIGIN_Y_OFFSET
    const direction = { x: 0, y: -1, z: 0 }
    const ray = new rapier.Ray(origin, direction)

    // const hit = world.castRay(ray, 10, true)
    const hit = world.castRay(
      ray,
      10,
      false,
      undefined,
      undefined,
      undefined,
      undefined,
      (collider) => {
        // As the ray origin is slightly inside the ball, we need to exlude the ball from ray cast detection
        // @ts-ignore
        return collider._parent.userData.name !== 'ball'
      },
    )
    // console.log(hit)
    if (hit && hit.timeOfImpact < 0.15) {
      body.current.applyImpulse({ x: 0, y: PHYSICS_FORCE.jump, z: 0 })
    }
  }

  const reset = () => {
    body.current.setTranslation({ x: 0, y: 3, z: 0 })
    body.current.setLinvel({ x: 0, y: 0, z: 0 })
    body.current.setAngvel({ x: 0, y: 0, z: 0 })
  }

  useEffect(() => {
    const unsubscribeReset = useGame.subscribe(
      (state) => state.phase,
      (value) => {
        if (value === 'ready') reset()
      },
    )

    const unsubscribeJump = subscribeKeys(
      (state) => state.jump,
      (value) => {
        if (value) {
          jump()
        }
      },
    )

    const unsubscribeAny = subscribeKeys(() => {
      start()
    })

    return () => {
      unsubscribeReset()
      unsubscribeJump()
      unsubscribeAny()
    }
  }, [])

  useEffect(() => {
    // Player name update
    // @ts-ignore
    if (playerName === 'unknown') {
      setPlayerName(localStorage.getItem('playerId') as string)
    }
  }, [playerName])

  useFrame((state, delta) => {
    const { forward, backward, leftward, rightward } = getKeys()

    const impulse = { x: 0, y: 0, z: 0 }
    const torque = { x: 0, y: 0, z: 0 }

    const impulseStrength = PHYSICS_FORCE.impulse * delta
    const torqueStrength = PHYSICS_FORCE.torque * delta

    if (forward) {
      body.current.wakeUp()
      impulse.z -= impulseStrength
      torque.x -= torqueStrength
    }

    if (rightward) {
      body.current.wakeUp()
      impulse.x += impulseStrength
      torque.z -= torqueStrength
    }

    if (backward) {
      body.current.wakeUp()
      impulse.z += impulseStrength
      torque.x += torqueStrength
    }

    if (leftward) {
      body.current.wakeUp()
      impulse.x -= impulseStrength
      torque.z += torqueStrength
    }

    if (body.current) {
      body.current.applyImpulse(impulse)
      body.current.applyTorqueImpulse(torque)
    }

    const bodyPosition = body.current.translation()

    // Update player position in store for other components to use
    updatePlayerPosition(new THREE.Vector3(bodyPosition.x, bodyPosition.y, bodyPosition.z))
    // updatePlayerImpulse(impulse, torque)

    const cameraPosition = new THREE.Vector3().copy(bodyPosition).add(CAMERA_POSITION)
    const cameraTarget = new THREE.Vector3().copy(bodyPosition)

    smoothedCameraPosition.lerp(cameraPosition, 5 * delta)
    smoothedCameraTarget.lerp(cameraTarget, 5 * delta)

    state.camera.position.copy(smoothedCameraPosition)
    state.camera.lookAt(smoothedCameraTarget)

    /** Phases **/
    if (bodyPosition.y < -4) restart()

    // Grass raycaster
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
        // As the ray origin is slightly inside the ball, we need to exlude the ball from ray cast detection
        // @ts-ignore
        return collider._parent.userData.name === 'terrain'
      },
    )
    if (hit) {
      updatePlayerGrassDistance(hit.timeOfImpact)
    }

    // Update text position
    if (textRef.current) {
      const textPosition = new THREE.Vector3().copy(bodyPosition).add(new THREE.Vector3(0, 1.0, 0))
      smoothedTextPosition.lerp(textPosition, 30 * delta)
      textRef.current.position.set(
        smoothedTextPosition.x,
        smoothedTextPosition.y,
        smoothedTextPosition.z,
      )
    }
  })

  return (
    <group>
      <RigidBody
        ref={body}
        canSleep={true}
        colliders='ball'
        restitution={0.2}
        friction={1}
        linearDamping={1.5}
        angularDamping={2.5}
        userData={{ name: 'ball' }}
      >
        <mesh castShadow geometry={nodes.character_body.geometry} material={material} />
      </RigidBody>
      <Text ref={textRef} characters={playerName} color='white' fontSize={0.4}>
        {playerName}
      </Text>
    </group>
  )
}

export { Player }
