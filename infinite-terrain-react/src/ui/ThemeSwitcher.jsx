import React from 'react'
import useStore from '../stores/useStore.jsx'
import './ThemeSwitcher.css'

export default function ThemeSwitcher() {
    const theme = useStore((state) => state.theme)
    const setTheme = useStore((state) => state.setTheme)

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark')
    }

    return (
        <div className="theme-switcher" onClick={toggleTheme}>
            <div className={`switcher-track ${theme}`}>
                <div className="switcher-thumb"></div>
            </div>
        </div>
    )
}
