import React, { useEffect, useRef } from 'react'
import { useKeyboardControls } from '@react-three/drei'
import './ControlsIcons.css'
import useStore from '../stores/useStore.jsx'

function ControlKey({ controlName, children, className = '' }) {
    const buttonRef = useRef()
    const [subscribeKeys, getKeys] = useKeyboardControls()
    const setControl = useStore((state) => state.setControl)

    useEffect(() => {
        const updateState = () => {
            // Get current values from both sources
            const isKeyPressed = getKeys()[controlName]
            const isStorePressed = useStore.getState().controls[controlName]
            const active = isKeyPressed || isStorePressed

            if (buttonRef.current) {
                if (active) {
                    buttonRef.current.classList.add('active')
                } else {
                    buttonRef.current.classList.remove('active')
                }
            }
        }

        // Subscribe to keyboard changes
        const unsubKeyboard = subscribeKeys((state) => state[controlName], updateState)

        // Subscribe to store changes (UI clicks)
        const unsubStore = useStore.subscribe((state) => state.controls[controlName], updateState)

        return () => {
            unsubKeyboard()
            unsubStore()
        }
    }, [controlName, subscribeKeys, getKeys])

    const handlePointerDown = (event) => {
        event.preventDefault()
        setControl(controlName, true)
    }

    const handlePointerUp = (event) => {
        event.preventDefault()
        setControl(controlName, false)
    }

    return (
        <div ref={buttonRef} className={`control-key ${className}`} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}>
            {children}
        </div>
    )
}

export default function ControlsIcons() {
    return (
        <div className="controls-icons">
            <div className="controls-row">
                <ControlKey controlName="forward">
                    <span className="arrow arrow-up"></span>
                </ControlKey>
            </div>
            <div className="controls-row">
                <ControlKey controlName="leftward">
                    <span className="arrow arrow-left"></span>
                </ControlKey>
                <ControlKey controlName="backward">
                    <span className="arrow arrow-down"></span>
                </ControlKey>
                <ControlKey controlName="rightward">
                    <span className="arrow arrow-right"></span>
                </ControlKey>
            </div>
            <div className="controls-row">
                <ControlKey controlName="jump" className="space" />
            </div>
        </div>
    )
}
