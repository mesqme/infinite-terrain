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
			<N8AO
				aoRadius={66}
				distanceFalloff={0.21}
				intensity={0.5}
				screenSpaceRadius={true}
				halfRes={false}
			/>
			{/* <Bloom /> */}
			<ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
		</EffectComposer>
	)
}
