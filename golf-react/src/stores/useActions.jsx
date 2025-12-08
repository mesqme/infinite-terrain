import { create } from 'zustand'

export const OVERLAY_STATE = {
    hidden: 'hidden',
    opaque: 'opaque',
}

const useActions = create((set) => ({
    overlayState: OVERLAY_STATE.opaque,
    showOverlay: () => set({ overlayState: OVERLAY_STATE.opaque }),
    hideOverlay: () => set({ overlayState: OVERLAY_STATE.hidden }),
    setOverlayState: (overlayState) => set({ overlayState }),
}))

export default useActions
