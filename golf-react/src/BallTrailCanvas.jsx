// BallTrailCanvas.jsx
import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useStore from './stores/useStore.jsx'

const TRAIL_CANVAS_SIZE = 256
const GLOW_SIZE = 0.12
const FADE_ALPHA = 0.01
const MOVE_EPSILON = 0.001

export default function BallTrailCanvas() {
    const ballPosition = useStore((state) => state.ballPosition)
    const setTrailTexture = useStore((state) => state.setTrailTexture)
    const trailPatchSize = useStore((state) => state.trailPatchSize)
    const landBallDistance = useStore((state) => state.landBallDistance)

    const canvasRef = useRef(null)
    const textureRef = useRef(null)
    const glowImageRef = useRef(null)
    const previousPositionRef = useRef(null)
    const ctxRef = useRef(null)
    const currentPosRef = useRef(new THREE.Vector3())
    const movementDeltaRef = useRef(new THREE.Vector3())

    useEffect(() => {
        const canvas = document.createElement('canvas')
        canvas.width = TRAIL_CANVAS_SIZE
        canvas.height = TRAIL_CANVAS_SIZE
        canvas.style.position = 'fixed'
        canvas.style.width = `${TRAIL_CANVAS_SIZE}px`
        canvas.style.height = `${TRAIL_CANVAS_SIZE}px`
        canvas.style.left = '0'
        canvas.style.bottom = '0'
        canvas.style.zIndex = '10'
        document.body.appendChild(canvas)

        ctxRef.current = canvas.getContext('2d')
        ctxRef.current.fillStyle = 'black'
        ctxRef.current.fillRect(0, 0, canvas.width, canvas.height)

        const texture = new THREE.CanvasTexture(canvas)
        texture.minFilter = THREE.LinearFilter
        texture.magFilter = THREE.LinearFilter
        texture.wrapS = THREE.ClampToEdgeWrapping
        texture.wrapT = THREE.ClampToEdgeWrapping

        const glowImage = new Image()
        glowImage.src = './textures/glow.png'

        canvasRef.current = canvas
        textureRef.current = texture
        glowImageRef.current = glowImage

        setTrailTexture(texture)

        return () => {
            setTrailTexture(null)
            texture.dispose()
            canvas.remove()
        }
    }, [setTrailTexture])

    useFrame(({ clock }) => {
        const delta = clock.getDelta()
        const canvas = canvasRef.current
        const ctx = ctxRef.current
        const glowImage = glowImageRef.current
        const texture = textureRef.current
        if (!canvas || !glowImage || !glowImage.complete || !texture) return

        const currentPosition = currentPosRef.current.copy(ballPosition)
        currentPosition.y = 0

        let previousPosition = previousPositionRef.current
        if (!previousPosition) {
            previousPosition = new THREE.Vector3().copy(currentPosition)
            previousPositionRef.current = previousPosition
        }

        const movementDelta = movementDeltaRef.current.subVectors(
            currentPosition,
            previousPosition
        )

        const patchSize = trailPatchSize
        const scale = canvas.width / patchSize

        const canvasDeltaX = -movementDelta.x * scale
        const canvasDeltaY = -movementDelta.z * scale
        const movementDistance = Math.hypot(canvasDeltaX, canvasDeltaY)

        const centerX = canvas.width * 0.5
        const centerY = canvas.height * 0.5

        if (movementDistance > MOVE_EPSILON) {
            ctx.save()
            ctx.globalCompositeOperation = 'copy'
            ctx.drawImage(canvas, canvasDeltaX, canvasDeltaY)
            ctx.restore()
        }

        ctx.globalCompositeOperation = 'source-over'
        // const effectiveFade = 1.0 - Math.pow(1.0 - FADE_ALPHA, delta * 2000.0)
        // ctx.globalAlpha = effectiveFade
        ctx.globalAlpha = FADE_ALPHA
        ctx.fillStyle = 'black'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        const baseAlpha = 0.3
        const speedAlpha = Math.min(movementDistance * 0.05, 0.7)
        let alpha = Math.min(baseAlpha + speedAlpha, 1)

        // Modulate alpha based on distance to ground
        // RAYCASTER_ORIGIN_Y_OFFSET = 0.35 is where glow starts decreasing
        // Distance >= 1.0 means glow is completely off
        const RAYCASTER_ORIGIN_Y_OFFSET = 0.35
        const MAX_DISTANCE = 1.0

        if (landBallDistance > RAYCASTER_ORIGIN_Y_OFFSET) {
            // Interpolate from full strength at RAYCASTER_ORIGIN_Y_OFFSET to 0 at MAX_DISTANCE
            const t = Math.min(
                (landBallDistance - RAYCASTER_ORIGIN_Y_OFFSET) /
                    (MAX_DISTANCE - RAYCASTER_ORIGIN_Y_OFFSET),
                1.0
            )
            alpha *= 1.0 - t // Decrease alpha as distance increases
        }

        const glowSize = canvas.width * GLOW_SIZE

        ctx.globalCompositeOperation = 'lighten'
        ctx.globalAlpha = alpha
        ctx.drawImage(
            glowImage,
            centerX - glowSize * 0.5,
            centerY - glowSize * 0.5,
            glowSize,
            glowSize
        )

        ctx.globalCompositeOperation = 'destination-over'
        ctx.globalAlpha = 1
        ctx.fillStyle = 'black'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        previousPosition.copy(currentPosition)
        texture.needsUpdate = true
    })

    return null
}
