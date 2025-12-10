import { EffectComposer, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'

export default function PostFX() {
    return (
        <EffectComposer>
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
    )
}
