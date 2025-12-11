import { useEffect, useRef, useState } from 'react'

import useActions, { OVERLAY_STATE } from './stores/useActions'

const FADE_DURATION_SEC = 0.6
const BG_COLOR = '#9a9065'

// Simple full-screen black overlay that fades in/out based on overlayState
export default function FadingScreen() {
    const overlayState = useActions((s) => s.overlayState)
    const [opacity, setOpacity] = useState(overlayState === OVERLAY_STATE.opaque ? 1 : 0)
    const opacityRef = useRef(opacity)

    useEffect(() => {
        const target = overlayState === OVERLAY_STATE.opaque ? 1 : 0
        const from = opacityRef.current
        if (from === target) return

        const durationMs = FADE_DURATION_SEC * 1000
        const start = performance.now()
        let raf = 0

        const tick = (now) => {
            const t = Math.min(1, (now - start) / durationMs)
            // smoothstep-ish easing
            const eased = t * t * (3 - 2 * t)
            const next = from + (target - from) * eased
            opacityRef.current = next
            setOpacity(next)
            if (t < 1) {
                raf = requestAnimationFrame(tick)
            }
        }

        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [overlayState])

    const pointerEvents = opacity > 0.01 ? 'auto' : 'none'

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: BG_COLOR,
                opacity,
                pointerEvents,
                zIndex: 9999,
                transition: 'opacity 0.05s linear', // minor smoothing for rapid toggles
            }}
        />
    )
}
