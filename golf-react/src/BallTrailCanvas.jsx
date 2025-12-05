// BallTrailCanvas.jsx
import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useStore from './stores/useStore.jsx'

const CHUNK_SIZE = 10
const GLOW_SIZE = 0.1
const FADE_ALPHA = 0.02
const MOVE_EPSILON = 0.001

export default function BallTrailCanvas() {
    const ballPosition = useStore((state) => state.ballPosition)
    const setTrailTexture = useStore((state) => state.setTrailTexture)

    const canvasRef = useRef(null)
    const textureRef = useRef(null)
    const glowImageRef = useRef(null)
    const previousPositionRef = useRef(null)

    useEffect(() => {
        const canvas = document.createElement('canvas')
        canvas.width = 256
        canvas.height = 256
        canvas.style.position = 'fixed'
        canvas.style.width = '256px'
        canvas.style.height = '256px'
        canvas.style.left = '0'
        canvas.style.bottom = '0'
        canvas.style.zIndex = '10'
        document.body.appendChild(canvas)

        const ctx = canvas.getContext('2d')
        ctx.fillStyle = 'black'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

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

    useFrame(() => {
        const canvas = canvasRef.current
        const glowImage = glowImageRef.current
        const texture = textureRef.current
        if (!canvas || !glowImage || !glowImage.complete || !texture) return

        const ctx = canvas.getContext('2d')

        const currentPosition = new THREE.Vector3().copy(ballPosition)
        currentPosition.y = 0

        let previousPosition = previousPositionRef.current
        if (!previousPosition) {
            previousPosition = new THREE.Vector3().copy(currentPosition)
            previousPositionRef.current = previousPosition
        }

        const movementDelta = new THREE.Vector3().subVectors(
            currentPosition,
            previousPosition
        )

        const patchSize = CHUNK_SIZE
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
        ctx.globalAlpha = FADE_ALPHA
        ctx.fillStyle = 'black'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        const baseAlpha = 0.3
        const speedAlpha = Math.min(movementDistance * 0.05, 0.7)
        const alpha = Math.min(baseAlpha + speedAlpha, 1)

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
