export default [
    {
        name: 'environmentMapTexture',
        type: 'cubeTexture',
        path: [
            '../assets/environmentMap/px.jpg',
            '../assets/environmentMap/nx.jpg',
            '../assets/environmentMap/py.jpg',
            '../assets/environmentMap/ny.jpg',
            '../assets/environmentMap/pz.jpg',
            '../assets/environmentMap/nz.jpg',
        ],
    },
    {
        name: 'grassColorTexture',
        type: 'texture',
        path: '../assets/textures/color.jpg',
    },
    {
        name: 'grassNormalTexture',
        type: 'texture',
        path: '../assets/textures/normal.jpg',
    },
    {
        name: 'noiseTexture',
        type: 'texture',
        path: '../assets/textures/noiseTexture.png',
    },
    {
        name: 'foxModel',
        type: 'gltfModel',
        path: '../assets/models/Fox.glb',
    },
]
