import React from 'react'
import './Links.css'
import { icons } from './icons'

export default function Links() {
    return (
        <div className="links">
            <a href="https://github.com/mesqme/infinite-terrain" target="_blank" rel="noopener noreferrer" className="link-item">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d={icons.github} />
                </svg>
            </a>
            <a href="https://www.linkedin.com/in/mesqme/" target="_blank" rel="noopener noreferrer" className="link-item">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d={icons.linkedin} />
                </svg>
            </a>
            <a href="https://x.com/mesqme" target="_blank" rel="noopener noreferrer" className="link-item">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d={icons.twitter} />
                </svg>
            </a>
        </div>
    )
}
