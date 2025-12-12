import { useProgress } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'

import usePhases, { PHASES } from '../stores/usePhases'
import './loader.css'

const RING_COLOR = '#ffffff'
const RING_TRACK_COLOR = 'rgba(0, 0, 0, 0.1)'

export default function Loader() {
    const { active, progress } = useProgress()
    const phase = usePhases((s) => s.phase)
    const setPhase = usePhases((s) => s.setPhase)

    const [displayed, setDisplayed] = useState(0)
    const [isHovered, setIsHovered] = useState(false)

    const lastPctRef = useRef(0)
    const displayedRef = useRef({ value: 0 })
    const centerRef = useRef(null)
    const isMouseInsideRef = useRef(false)

    // Calculate target progress
    const target = useMemo(() => {
        const clamped = Math.min(100, Math.max(0, progress))
        return active ? Math.max(1, clamped) : clamped
    }, [active, progress])

    // Animate displayed value toward target using GSAP
    useEffect(() => {
        displayedRef.current.value = displayed

        const animation = gsap.to(displayedRef.current, {
            value: target,
            duration: 0.3,
            ease: 'power1.out',
            onUpdate: () => {
                setDisplayed(displayedRef.current.value)
            },
        })

        return () => animation.kill()
    }, [target]) // eslint-disable-line react-hooks/exhaustive-deps

    // Calculate percent (monotonic, never decreases)
    const percent = useMemo(() => {
        const raw = Math.round(Math.max(0, Math.min(100, displayed)))
        if (raw < lastPctRef.current) return lastPctRef.current
        lastPctRef.current = raw
        return raw
    }, [displayed])

    // Transition from loading to warmup when complete
    useEffect(() => {
        if (phase === PHASES.loading && !active && percent >= 100) {
            setPhase(PHASES.warmup)
        }
    }, [phase, active, percent, setPhase])

    // Set hover state when transitioning to warmup if mouse is already inside
    useEffect(() => {
        if (phase === PHASES.warmup && isMouseInsideRef.current) {
            setIsHovered(true)
        } else if (phase === PHASES.loading) {
            setIsHovered(false)
        }
    }, [phase])

    const handleMouseEnter = () => {
        isMouseInsideRef.current = true
        if (phase === PHASES.warmup) {
            setIsHovered(true)
        }
    }

    const handleMouseLeave = () => {
        isMouseInsideRef.current = false
        setIsHovered(false)
    }

    const handleClick = () => {
        if (phase === PHASES.warmup) {
            setPhase(PHASES.start)
        }
    }

    const showLoading = phase === PHASES.loading
    const showStart = phase === PHASES.warmup

    if (!showLoading && !showStart) return null

    const ringStyle = {
        background: `conic-gradient(from -90deg, ${RING_COLOR} ${percent * 3.6}deg, ${RING_TRACK_COLOR} ${percent * 3.6}deg)`,
    }

    return (
        <div className="loader-wrapper">
            <div className="loader-container">
                <div className="loader-ring" style={ringStyle}>
                    <div className="loader-ring-inner" />
                </div>
                <div
                    ref={centerRef}
                    className={`loader-center ${showStart ? 'loader-center--clickable' : ''} ${showStart && isHovered ? 'loader-center--hovered' : ''}`}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    onClick={handleClick}
                >
                    {showLoading && <div className="loader-percent">{percent}%</div>}
                    {showStart && <div className={`loader-go-button ${isHovered ? 'loader-go-button--hovered' : ''}`}>GO</div>}
                </div>
            </div>
        </div>
    )
}
