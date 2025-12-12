export default function Lights() {
    return (
        <>
            <directionalLight position={[4, 10, 1]} intensity={4.5} />
            <ambientLight intensity={3.5} />
        </>
    )
}
