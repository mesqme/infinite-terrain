import { useProgress } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'

import usePhases, { PHASES } from './stores/usePhases'
import useActions from './stores/useActions'

const LOADER_STYLE = {
    wrapper: {
        position: 'fixed',
        inset: 0,
        background: '#000',
        color: '#fff',
        zIndex: 10000,
        display: 'grid',
        placeItems: 'center',
        fontFamily: "'Inter', sans-serif",
    },
    panel: {
        width: 'min(520px, 90vw)',
        textAlign: 'center',
    },
    barFrame: {
        border: '2px solid rgba(255,255,255,0.9)',
        padding: '6px',
        marginTop: '12px',
    },
    bar: {
        height: '18px',
        background: 'rgba(255,255,255,0.18)',
    },
    fill: (percent) => ({
        height: '100%',
        width: `${percent}%`,
        background: '#fff',
        transition: 'width 0.2s ease',
    }),
    startButton: {
        padding: '10px 22px',
        fontSize: '22px',
        letterSpacing: '0.06em',
        color: '#fff',
        background: 'transparent',
        border: '2px solid #fff',
        cursor: 'pointer',
        marginTop: '10px',
    },
}

export default function Loader() {
    const { active, progress } = useProgress()

    const phase = usePhases((s) => s.phase)
    const setPhase = usePhases((s) => s.setPhase)

    const hideOverlay = useActions((s) => s.hideOverlay)

    const lastPctRef = useRef(0)
    const [displayed, setDisplayed] = useState(0)

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
            <div style={LOADER_STYLE.panel}>
                {showLoading && (
                    <>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'baseline',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 28,
                                    letterSpacing: '0.04em',
                                }}
                            >
                                LOADING
                            </div>
                            <div style={{ fontSize: 28 }}>{percent}%</div>
                        </div>
                        <div style={LOADER_STYLE.barFrame}>
                            <div style={LOADER_STYLE.bar}>
                                <div style={LOADER_STYLE.fill(percent)} />
                            </div>
                        </div>
                    </>
                )}

                {showStart && (
                    <button style={LOADER_STYLE.startButton} onClick={onStart}>
                        START
                    </button>
                )}
            </div>
        </div>
    )
}
