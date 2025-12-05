import {
    EffectComposer,
    Bloom,
    N8AO,
    ToneMapping,
} from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'

export default function PostFX() {
    return (
        <EffectComposer>
            {/* <Bloom /> */}
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
    )
}
