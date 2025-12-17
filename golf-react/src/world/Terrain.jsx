import { useState, useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { createNoise2D } from 'simplex-noise'
import * as THREE from 'three'
import { gsap } from 'gsap'

import TerrainChunk from './TerrainChunk.jsx'
import useStore from '../stores/useStore.jsx'
import usePhases, { PHASES } from '../stores/usePhases.jsx'

import noiseTextureURL from '/textures/noiseTexture.png'
import terrainVertexShader from '../shaders/terrain/vertex.glsl'
import terrainFragmentShader from '../shaders/terrain/fragment.glsl'
import grassVertexShader from '../shaders/grass/vertex.glsl'
import grassFragmentShader from '../shaders/grass/fragment.glsl'

export default function Terrain() {
    const [activeChunks, setActiveChunks] = useState([])

    const currentChunk = useRef({ x: 0, z: 0 })
    const radiusAnimationRef = useRef(null)
    const prevPhaseRef = useRef(PHASES.loading)

    const chunkSize = useStore((s) => s.terrainParameters.chunkSize)
    const terrainParameters = useStore((s) => s.terrainParameters)
    const borderParameters = useStore((s) => s.borderParameters)
    const grassParameters = useStore((s) => s.grassParameters)
    const trailParameters = useStore((s) => s.trailParameters)
    const setBorderParameters = useStore((s) => s.setBorderParameters)
    const phase = usePhases((s) => s.phase)

    // Noise generator
    const noise2D = useMemo(() => createNoise2D(), [])

    // Noise texture
    const noiseTexture = useTexture(
        noiseTextureURL,
        (texture) => {
            texture.wrapS = THREE.RepeatWrapping
            texture.wrapT = THREE.RepeatWrapping
            texture.minFilter = THREE.LinearFilter
            texture.magFilter = THREE.LinearFilter
            return texture
        },
        [noiseTextureURL]
    )

    // Terrain material - shared across all chunks
    const terrainMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                uBaseColor: { value: new THREE.Color(terrainParameters.color) },
                uFadeColor: {
                    value: new THREE.Color(terrainParameters.fadeColor),
                },
                uCircleCenter: { value: new THREE.Vector3() },
                uTrailPatchSize: { value: chunkSize },
                uCircleRadiusFactor: { value: borderParameters.circleRadiusFactor },
                uGrassFadeOffset: { value: borderParameters.grassFadeOffset },
                uGroundOffset: { value: borderParameters.groundOffset },
                uGroundFadeOffset: { value: borderParameters.groundFadeOffset },
                uNoiseTexture: { value: noiseTexture },
                uNoiseStrength: { value: borderParameters.noiseStrength },
                uNoiseScale: { value: borderParameters.noiseScale },
            },
            vertexShader: terrainVertexShader,
            fragmentShader: terrainFragmentShader,
        })
    }, [terrainParameters, chunkSize, borderParameters, noiseTexture])

    // Grass material - shared across all chunks
    const grassMaterial = useMemo(
        () =>
            new THREE.ShaderMaterial({
                uniforms: {
                    uTime: { value: 0 },
                    uResolution: { value: new THREE.Vector2(1, 1) },
                    uGrassSegments: { value: grassParameters.segmentsCount },
                    uGrassChunkSize: { value: chunkSize },
                    uGrassWidth: { value: grassParameters.width },
                    uGrassHeight: { value: grassParameters.height },
                    uGrassBaseColor: { value: new THREE.Color(grassParameters.colorBase) },
                    uGrassTopColor: { value: new THREE.Color(grassParameters.colorTop) },
                    uLeanFactor: { value: grassParameters.leanFactor },

                    uWindScale: { value: grassParameters.windScale },
                    uWindStrength: { value: grassParameters.windStrength },
                    uWindSpeed: { value: grassParameters.windSpeed },
                    uTrailTexture: { value: null },
                    uBallPosition: { value: new THREE.Vector3() },
                    uCircleCenter: { value: new THREE.Vector3() },
                    uTrailCanvasSize: { value: trailParameters.chunkSize },
                    uSobelMode: { value: grassParameters.sobelMode },

                    uNoiseTexture: { value: noiseTexture },
                    uNoiseStrength: { value: borderParameters.noiseStrength },
                    uNoiseScale: { value: borderParameters.noiseScale },
                    uCircleRadiusFactor: { value: borderParameters.circleRadiusFactor },
                    uGrassFadeOffset: { value: borderParameters.grassFadeOffset },
                    uGroundOffset: { value: borderParameters.groundOffset },
                    uGroundFadeOffset: { value: borderParameters.groundFadeOffset },
                },
                vertexShader: grassVertexShader,
                fragmentShader: grassFragmentShader,
                side: THREE.FrontSide,
            }),
        [grassParameters, chunkSize, trailParameters.chunkSize, noiseTexture, borderParameters]
    )

    // Cleanup materials on unmount
    useEffect(() => {
        return () => {
            terrainMaterial.dispose()
            grassMaterial.dispose()
        }
    }, [terrainMaterial, grassMaterial])

    // Handle radius animation
    const handleRadiusAnimation = () => {
        const targetRadius = borderParameters.circleRadiusFactor
        const startRadius = 0.2

        // Kill previous animation if it exists
        if (radiusAnimationRef.current) {
            radiusAnimationRef.current.kill()
            radiusAnimationRef.current = null
        }

        // Set initial radius to 0.2
        terrainMaterial.uniforms.uCircleRadiusFactor.value = startRadius
        grassMaterial.uniforms.uCircleRadiusFactor.value = startRadius

        // Create animation object for GSAP to animate
        const radiusObj = { value: startRadius }

        // Animate radius from 0.2 to target value
        radiusAnimationRef.current = gsap.to(radiusObj, {
            value: targetRadius,
            duration: 1.2,
            ease: 'power2.out',
            onUpdate: () => {
                // Update both materials' circle radius factor
                terrainMaterial.uniforms.uCircleRadiusFactor.value = radiusObj.value
                grassMaterial.uniforms.uCircleRadiusFactor.value = radiusObj.value
            },
            onComplete: () => {
                // Update store to keep values in sync
                setBorderParameters({
                    ...borderParameters,
                    circleRadiusFactor: targetRadius,
                })
                radiusAnimationRef.current = null
            },
        })
    }

    // Listen for game start trigger from Loader
    useEffect(() => {
        // Only trigger when it changes from false to true
        if (phase === PHASES.start && prevPhaseRef.current !== PHASES.start) {
            handleRadiusAnimation()
        }
        // Update the ref to track the current value
        prevPhaseRef.current = phase
    }, [phase, borderParameters, terrainMaterial, grassMaterial, setBorderParameters])

    // Cleanup animations on unmount
    useEffect(() => {
        return () => {
            if (radiusAnimationRef.current) {
                radiusAnimationRef.current.kill()
                radiusAnimationRef.current = null
            }
        }
    }, [])

    useFrame(({ clock }) => {
        const state = useStore.getState()

        // Update terrain material uniforms
        terrainMaterial.uniforms.uCircleCenter.value.copy(state.smoothedCircleCenter)

        // Update grass material uniforms
        grassMaterial.uniforms.uTime.value = clock.elapsedTime
        grassMaterial.uniforms.uTrailTexture.value = state.trailTexture
        grassMaterial.uniforms.uBallPosition.value.copy(state.ballPosition)
        grassMaterial.uniforms.uCircleCenter.value.copy(state.smoothedCircleCenter)

        // Chunk management
        const ballPosition = state.ballPosition
        const safeChunkSize = Math.max(0.0001, chunkSize)
        const chunkX = Math.round(ballPosition.x / safeChunkSize)
        const chunkZ = Math.round(ballPosition.z / safeChunkSize)

        if (chunkX !== currentChunk.current.x || chunkZ !== currentChunk.current.z || currentChunk.current.size !== safeChunkSize || activeChunks.length === 0) {
            currentChunk.current = { x: chunkX, z: chunkZ, size: safeChunkSize }

            const newChunks = []
            for (let x = -1; x <= 1; x++) {
                for (let z = -1; z <= 1; z++) {
                    newChunks.push({
                        x: chunkX + x,
                        z: chunkZ + z,
                        key: `${chunkX + x},${chunkZ + z}`,
                    })
                }
            }
            setActiveChunks(newChunks)
        }
    })

    return (
        <group>
            {activeChunks.map((chunk) => (
                <TerrainChunk
                    key={chunk.key}
                    x={chunk.x}
                    z={chunk.z}
                    size={chunkSize}
                    noise2D={noise2D}
                    noiseTexture={noiseTexture}
                    terrainMaterial={terrainMaterial}
                    grassMaterial={grassMaterial}
                />
            ))}
        </group>
    )
}
