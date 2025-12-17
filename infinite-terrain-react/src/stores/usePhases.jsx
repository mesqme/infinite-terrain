import { create } from 'zustand'

export const PHASES = {
    loading: 'loading',
    warmup: 'warmup',
    start: 'start',
}

const usePhases = create((set) => ({
    phase: PHASES.loading,
    setPhase: (phase) => set({ phase }),
    resetPhase: () => set({ phase: PHASES.loading }),
}))

export default usePhases
