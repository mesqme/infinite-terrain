import restart from 'vite-plugin-restart'
import wasm from 'vite-plugin-wasm'

export default {
    root: 'src/', // Sources files (typically where index.html is)
    assetsInclude: ['**/*.glb'], // Handle .glb files as assets
    server: {
        host: true, // Open to local network and display URL
        open: !(
            'SANDBOX_URL' in process.env || 'CODESANDBOX_HOST' in process.env
        ), // Open if it's not a CodeSandbox
    },
    build: {
        outDir: '../dist', // Output in the dist/ folder
        emptyOutDir: true, // Empty the folder first
        sourcemap: true, // Add sourcemap
    },
    plugins: [wasm()],
}
