import * as THREE from 'https://cdn.skypack.dev/three'
import { TrackballControls } from 'https://cdn.skypack.dev/three/examples/jsm/controls/TrackballControls'
// import { OrbitControls } from 'https://cdn.skypack.dev/three/examples/jsm/controls/OrbitControls'
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three-orbitcontrols@2.110.3/OrbitControls.js'

import { Arrow } from './arrow.js'
import { combine } from './func.js'
import { makeGeometry } from './threeHelper.js'
import { SpinControls } from './spin.js'
import { XYZRotationControls } from './controls.js'

//
// # Renderer
//
const renderer = new THREE.WebGLRenderer({ antialias: true })
// Make Canvas Responsive
window.addEventListener('resize', () => {
    // renderer.setSize(window.innerWidth, window.innerHeight) // Update size
    // camera.aspect = window.innerWidth / window.innerHeight // Update aspect ratio
    // camera.updateProjectionMatrix() // Apply changes
})

//
// # Arrow Geometry
//
const arrowData = new Arrow(
    1, // length
    0.25, // headLength
    0.025, // smallRadius
    0.050, // largeRadius
    32, // angularSteps
    4, // bodySteps
    4, // headSteps
)
const arrowGeometry = makeGeometry(
    arrowData.getPositions(),
    arrowData.getNormals(),
    arrowData.triangles,
)

//
// # Arrow Geometry
//
const arrowSecondaryData = new Arrow(
    1 * 0.99, // length
    0.25 * 0.99, // headLength
    0.025 * 0.8, // smallRadius
    0.050 * 0.8, // largeRadius
    24, // angularSteps
    4, // bodySteps
    4, // headSteps
)
const arrowSecondaryGeometry = makeGeometry(
    arrowSecondaryData.getPositions(),
    arrowSecondaryData.getNormals(),
    arrowSecondaryData.triangles,
)

function createSceneAndCamera() {
    //
    // # Scene
    //
    const scene = new THREE.Scene()

    scene.add(new THREE.GridHelper(10, 10))

    const group = new THREE.Group();
    scene.add(group);

    //
    // # Basis Vectors Arrows
    //
    const red = 0xFF0000
    const green = 0x00FF00
    const blue = 0x0000FF

    // x-arrow
    {
        const material = new THREE.MeshBasicMaterial({ color: red })
        const arrow = new THREE.Mesh(arrowGeometry, material)
        arrow.rotation.y = Math.PI / 2
        group.add(arrow)
    }

    // y-arrow
    {
        const material = new THREE.MeshBasicMaterial({ color: green })
        const arrow = new THREE.Mesh(arrowGeometry, material)
        arrow.rotation.x = -Math.PI / 2
        group.add(arrow)
    }

    // z-arrow
    {
        const material = new THREE.MeshBasicMaterial({ color: blue })
        const arrow = new THREE.Mesh(arrowGeometry, material)
        group.add(arrow)
    }

    // x-arrow (thin)
    {
        const dir = new THREE.Vector3(1, 0, 0)
        const origin = new THREE.Vector3(0, 0, 0)
        const length = 1
        const hex = red
        const arrowHelper = new THREE.ArrowHelper(dir, origin, length, hex)
        arrowHelper.line.material.linewidth = 4
        group.add(arrowHelper)
    }

    // y-arrow (thin)
    {
        const dir = new THREE.Vector3(0, 1, 0)
        const origin = new THREE.Vector3(0, 0, 0)
        const length = 1
        const hex = green
        const arrowHelper = new THREE.ArrowHelper(dir, origin, length, hex)
        arrowHelper.line.material.linewidth = 4
        group.add(arrowHelper)
    }

    // z-arrow (thin)
    {
        const dir = new THREE.Vector3(0, 0, 1)
        const origin = new THREE.Vector3(0, 0, 0)
        const length = 1
        const hex = blue
        const arrowHelper = new THREE.ArrowHelper(dir, origin, length, hex)
        arrowHelper.line.material.linewidth = 4
        group.add(arrowHelper)
    }

    //
    // # Rotated Vectors Arrows
    //
    const rotGroup = new THREE.Group()
    scene.add(rotGroup)
    const red2 = 0xAA3311
    const green2 = 0x11AA33
    const blue2 = 0x3311AA

    // x-arrow
    const customArrows = []
    {
        const material = new THREE.MeshBasicMaterial({ color: red2 })
        const arrow = new THREE.Mesh(arrowSecondaryGeometry, material)
        rotGroup.add(arrow)
        customArrows.push(arrow)
    }

    // y-arrow
    {
        const material = new THREE.MeshBasicMaterial({ color: green2 })
        const arrow = new THREE.Mesh(arrowSecondaryGeometry, material)
        rotGroup.add(arrow)
        customArrows.push(arrow)
    }

    // z-arrow
    {
        const material = new THREE.MeshBasicMaterial({ color: blue2 })
        const arrow = new THREE.Mesh(arrowSecondaryGeometry, material)
        rotGroup.add(arrow)
        customArrows.push(arrow)
    }

    //
    // # Camera
    //
    const camera = new THREE.PerspectiveCamera(
        75, // fov
        1 / 1, // aspect
        0.3, // near
        1200, // far
    )
    camera.position.z = 5 // Set camera position
    scene.add(camera)

    //
    // # Lights
    //
    const lightValues = [
        // Properties for each light
        { colour: 0xFFFFFF, intensity: 2, dist: 12, x: 1, y: 1, z: 1 },
    ]

    const lights = [] // Storage for lights
    for (let i = 0; i < lightValues.length; i++) {
        lights[i] = new THREE.PointLight(
            lightValues[i]['colour'],
            lightValues[i]['intensity'],
            lightValues[i]['dist'],
        )

        lights[i].position.set(
            lightValues[i]['x'],
            lightValues[i]['y'],
            lightValues[i]['z'],
        )

        scene.add(lights[i])
    }

    return {scene, camera, group, rotGroup, customArrows}
}

/** @type {function|null} */
let update = null

function createVisualization(idCanvas, components, updateMatrix) {
    const {scene, camera, group, rotGroup, customArrows} = components

    /** @type {HTMLCanvasElement} */
    let canvas = document.getElementById(idCanvas)
    let context = canvas.getContext('2d')

    //Trackball Controls for Camera
    const controls = new TrackballControls(camera, canvas)
    controls.rotateSpeed = 4
    controls.dynamicDampingFactor = 0.15
    controls.noPan = true
    // TODO: try using this spin control for 3d-objects
    // const controls = new SpinControls(group, 255, camera, renderer.domElement)
    // controls.setPointerToSphereMapping( controls.POINTER_SPHERE_MAPPING.HOLROYD ) 

    if (updateMatrix) {
        const xyzRot = new XYZRotationControls(rotGroup, canvas)
        // xyzRot._testTrackMousePoint = []
        // xyzRot.test()
        xyzRot.addEventListener("keystatechanged", (state) => controls.enabled = state == -1)
        xyzRot.addEventListener("updatematrix", (m) => updateMatrix(m))
    }

    window.addEventListener( 'resize', () => controls.onWindowResize(), false )

    update = combine(update, () => {
        controls.update()
        renderer.setClearColor("#233143") // Set background colour
        renderer.setSize(context.canvas.clientWidth, context.canvas.clientHeight)
        camera.aspect = context.canvas.clientWidth / context.canvas.clientHeight // Update aspect ratio
        camera.updateProjectionMatrix() // Apply changes
        renderer.render(scene, camera)
        context.drawImage(renderer.domElement, 0, 0, canvas.width, canvas.height)
    })
}

/**
 * Aligns an arrow with the given vector so that
 * the arrow represents the vector on the 3d world.
 * @param {THREE.Mesh} arrow 
 * @param {number[]} vector 
 */
function arrowAlignWithVector(arrow, vector) {
    arrow.lookAt(...vector)
}

function alignArrowsWithVectors(arrows, matrixElements) {
    for (let it = 0; it < 3; it++) {
        arrowAlignWithVector(
            arrows[it],
            matrixElements.slice(it * 4, (it + 1) * 4 - 1),
        )
    }
}

const rotationVectors = new THREE.Matrix4()
rotationVectors.set(
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
)
const operatorVectors = new THREE.Matrix4()
operatorVectors.set(
    1.5, 0.5, 0.5, 0,
    0.5, 1.0, 0.5, 0,
    0.0, 0.5, 1.5, 0,
    0.0, 0.0, 0.0, 1,
)
const resultingVectors = new THREE.Matrix4()
resultingVectors.multiplyMatrices(rotationVectors, operatorVectors)
let resultingArrows
function onUpdateMatrix(m) {
    for (let it = 0; it < rotationVectors.elements.length; it++) {
        rotationVectors.elements[it] = m[it]
    }
    resultingVectors.multiplyMatrices(operatorVectors, rotationVectors)
    alignArrowsWithVectors(resultingArrows, resultingVectors.elements)
}

const info1 = createSceneAndCamera()
alignArrowsWithVectors(info1.customArrows, rotationVectors.elements)
createVisualization("canvas-vetores", info1, onUpdateMatrix)

const info2 = createSceneAndCamera()
alignArrowsWithVectors(info2.customArrows, operatorVectors.elements)
createVisualization("canvas-operador", info2)

const info3 = createSceneAndCamera()
alignArrowsWithVectors(info3.customArrows, resultingVectors.elements)
resultingArrows = info3.customArrows
createVisualization("canvas-resultado", info3)

// Rendering Function
const rendering = function () {
    // Rerender every time the page refreshes (pause when on another tab)
    requestAnimationFrame(rendering)

    // Update trackball controls
    update()
}
rendering()
