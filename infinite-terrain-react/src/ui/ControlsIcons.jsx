import React, { useEffect, useState } from 'react'
import './ControlsIcons.css'

export default function ControlsIcons() {
    const [activeKeys, setActiveKeys] = useState({
        up: false,
        down: false,
        left: false,
        right: false,
        space: false,
    })

    useEffect(() => {
        const handleKeyDown = (event) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    setActiveKeys((prev) => ({ ...prev, up: true }))
                    break
                case 'ArrowDown':
                case 'KeyS':
                    setActiveKeys((prev) => ({ ...prev, down: true }))
                    break
                case 'ArrowLeft':
                case 'KeyA':
                    setActiveKeys((prev) => ({ ...prev, left: true }))
                    break
                case 'ArrowRight':
                case 'KeyD':
                    setActiveKeys((prev) => ({ ...prev, right: true }))
                    break
                case 'Space':
                    setActiveKeys((prev) => ({ ...prev, space: true }))
                    break
                default:
                    break
            }
        }

        const handleKeyUp = (event) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    setActiveKeys((prev) => ({ ...prev, up: false }))
                    break
                case 'ArrowDown':
                case 'KeyS':
                    setActiveKeys((prev) => ({ ...prev, down: false }))
                    break
                case 'ArrowLeft':
                case 'KeyA':
                    setActiveKeys((prev) => ({ ...prev, left: false }))
                    break
                case 'ArrowRight':
                case 'KeyD':
                    setActiveKeys((prev) => ({ ...prev, right: false }))
                    break
                case 'Space':
                    setActiveKeys((prev) => ({ ...prev, space: false }))
                    break
                default:
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
        }
    }, [])

    return (
        <div className="controls-icons">
            <div className="controls-row">
                <div className={`control-key ${activeKeys.up ? 'active' : ''}`}>
                    <span className="arrow arrow-up"></span>
                </div>
            </div>
            <div className="controls-row">
                <div className={`control-key ${activeKeys.left ? 'active' : ''}`}>
                    <span className="arrow arrow-left"></span>
                </div>
                <div className={`control-key ${activeKeys.down ? 'active' : ''}`}>
                    <span className="arrow arrow-down"></span>
                </div>
                <div className={`control-key ${activeKeys.right ? 'active' : ''}`}>
                    <span className="arrow arrow-right"></span>
                </div>
            </div>
            <div className="controls-row">
                <div className={`control-key space ${activeKeys.space ? 'active' : ''}`}></div>
            </div>
        </div>
    )
}
