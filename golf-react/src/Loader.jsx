import { useProgress } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'

import usePhases, { PHASES } from './stores/usePhases'
import useActions from './stores/useActions'

const BG_COLOR = '#9a9065'
const RING_COLOR = '#ffffff'
const RING_TRACK_COLOR = 'rgba(0, 0, 0, 0.1)'
const RING_SIZE = 200
const RING_THICKNESS = 12

const LOADER_STYLE = {
    wrapper: {
        position: 'fixed',
        inset: 0,
        background: BG_COLOR,
        zIndex: 10000,
        display: 'grid',
        placeItems: 'center',
        fontFamily: "'Bebas Neue', sans-serif",
    },
    container: {
        position: 'relative',
        display: 'grid',
        placeItems: 'center',
    },
    ring: (percent) => {
        const deg = percent * 3.6 // Convert percentage to degrees (100% = 360deg)
        return {
            width: RING_SIZE,
            height: RING_SIZE,
            borderRadius: '50%',
            background: `conic-gradient(from -90deg, ${RING_COLOR} ${deg}deg, ${RING_TRACK_COLOR} ${deg}deg)`,
            padding: RING_THICKNESS,
            boxSizing: 'border-box',
            transition: 'background 0.2s ease',
        }
    },
    ringInner: {
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        background: BG_COLOR,
    },
    center: (isHovered, showStart) => ({
        position: 'absolute',
        display: 'grid',
        placeItems: 'center',
        width: RING_SIZE,
        height: RING_SIZE,
        borderRadius: '50%',
        backgroundColor: isHovered ? '#ffffff' : 'transparent',
        transition: 'background-color 0.2s ease',
        cursor: showStart ? 'pointer' : 'default',
    }),
    percent: (isHovered) => ({
        fontSize: '48px',
        color: isHovered ? BG_COLOR : RING_COLOR,
        fontFamily: "'Bebas Neue', sans-serif",
        fontWeight: 100,
        letterSpacing: '0.1em',
        fontStretch: 'condensed',
        transition: 'color 0.2s ease',
    }),
    goButton: (isHovered) => ({
        fontSize: '52px',
        letterSpacing: '0.15em',
        color: isHovered ? BG_COLOR : RING_COLOR,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '8px 16px',
        fontFamily: "'Bebas Neue', sans-serif",
        fontWeight: 100,
        fontStretch: 'condensed',
        transition: 'color 0.2s ease',
    }),
}

export default function Loader() {
    const { active, progress } = useProgress()

    const phase = usePhases((s) => s.phase)
    const setPhase = usePhases((s) => s.setPhase)

    const hideOverlay = useActions((s) => s.hideOverlay)

    const lastPctRef = useRef(0)
    const [displayed, setDisplayed] = useState(0)
    const [isHovered, setIsHovered] = useState(false)

    // target progress (ensures >= actual, capped 100)
    const target = useMemo(() => {
        const clamped = Math.min(100, Math.max(0, progress))
        return active ? Math.max(1, clamped) : clamped
    }, [active, progress])

    // smooth ease toward target
    useEffect(() => {
        let raf = 0
        const tick = () => {
            setDisplayed((prev) => {
                const diff = target - prev
                if (Math.abs(diff) < 0.2) return target
                return prev + diff * 0.2
            })
            raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [target])

    const percent = useMemo(() => {
        const raw = Math.round(Math.max(0, Math.min(100, displayed)))
        if (raw < lastPctRef.current) return lastPctRef.current
        lastPctRef.current = raw
        return raw
    }, [displayed])

    // loading -> warmup when done
    useEffect(() => {
        if (phase === PHASES.loading && !active && percent >= 100) {
            setPhase(PHASES.warmup)
        }
    }, [phase, active, percent, setPhase])

    const onStart = () => {
        hideOverlay()
        setPhase(PHASES.start)
    }

    const showLoading = phase === PHASES.loading
    const showStart = phase === PHASES.warmup

    if (!showLoading && !showStart) return null

    return (
        <div style={LOADER_STYLE.wrapper}>
            <div style={LOADER_STYLE.container}>
                <div style={LOADER_STYLE.ring(percent)}>
                    <div style={LOADER_STYLE.ringInner} />
                </div>
                <div style={LOADER_STYLE.center(isHovered, showStart)} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
                    {showLoading && <div style={LOADER_STYLE.percent(isHovered)}>{percent}%</div>}
                    {showStart && (
                        <button style={LOADER_STYLE.goButton(isHovered)} onClick={onStart}>
                            GO
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
