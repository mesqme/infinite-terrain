// useStore.jsx
import { create } from 'zustand'
import * as THREE from 'three'

const useStore = create((set) => ({
    ballPosition: new THREE.Vector3(0, 0, 0),
    updateBallPosition: (position) => {
        set({ ballPosition: position.clone() })
    },

    trailTexture: null,
    setTrailTexture: (texture) => {
        set({ trailTexture: texture })
    },
}))

export default useStore
