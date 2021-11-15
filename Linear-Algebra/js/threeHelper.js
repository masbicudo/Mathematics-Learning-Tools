import * as THREE from 'https://cdn.skypack.dev/three'

export function makeGeometry(positions, normals, triangles) {
    const geometry = new THREE.BufferGeometry()
    const positionNumComponents = 3
    const normalNumComponents = 3
    geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(
            new Float32Array(positions),
            positionNumComponents,
        ),
    )
    geometry.setAttribute(
        'normal',
        new THREE.BufferAttribute(
            new Float32Array(normals),
            normalNumComponents,
        ),
    )
    geometry.setIndex(triangles)
    return geometry
}
