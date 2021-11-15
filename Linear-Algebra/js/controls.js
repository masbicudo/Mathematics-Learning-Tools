import { combine } from "./func.js"
import { normalize } from "./linalg.js"

class STATE {
    static NONE = -1
    static AROUND_X = 0
    static AROUND_Y = 1
    static AROUND_Z = 2
}

export class XYZRotationControls {
    #private = {
        xys: [],
        distances: [],
        keyState: STATE.NONE,
        key: null,
        mouseDown: false,
        started: false,
        handleMouseDown: null,
        handleMouseMove: null,
        handleMouseUp: null,
        keydownHandler: null,
        keyupHandler: null,
    }

    constructor(obj, el) {
        const priv = this.#private
        this.onStart = null
        this.onStop = null
        this.onKeyStateChanged = null
        this.onUpdateMatrix = null
        this.obj = obj
        this._testTrackMousePoint = null
        obj.matrixAutoUpdate = false
        this.keys = [
            ["Digit1", "KeyX", "KeyR"], // around x-axis
            ["Digit2", "KeyY", "KeyG"], // around y-axis
            ["Digit3", "KeyZ", "KeyB"], // around z-axis
        ]

        this.enabled = true

        // setting up event handlers
        priv.handleMouseDown = e => this.handleMouseDown(e)
        priv.handleMouseMove = e => this.handleMouseMove(e)
        priv.handleMouseUp = e => this.handleMouseUp(e)
        priv.keydownHandler = e => this.handleKeyDown(e)
        priv.keyupHandler = e => this.handleKeyUp(e)
        el.addEventListener("mousedown", priv.handleMouseDown)
        el.addEventListener("mousemove", priv.handleMouseMove)
        el.addEventListener("mouseup", priv.handleMouseUp)
        window.addEventListener("keydown", priv.keydownHandler)
        window.addEventListener("keyup", priv.keyupHandler)
    }

    addEventListener(type, handler) {
        if (type == "start")
            this.onStart = combine(this.onStart, handler)
        else if (type == "stop")
            this.onStop = combine(this.onStop, handler)
        else if (type == "keystatechanged")
            this.onKeyStateChanged = combine(this.onKeyStateChanged, handler)
        else if (type == "updatematrix")
            this.onUpdateMatrix = combine(this.onUpdateMatrix, handler)
        else
            throw new Error("Invalid event type")
    }

    handleMouseDown(e) {
        const priv = this.#private
        if (priv.keyState == STATE.NONE)
            return
        priv.mouseDown = true
        priv.xys.length = 0
        priv.distances.length = 0
        this.handleMouseMove(e)
    }

    handleMouseMove(e) {
        const priv = this.#private
        if (priv.keyState == STATE.NONE || priv.mouseDown == false)
            return
        const xys = priv.xys
        const distances = priv.distances
        if (xys.length == 0) {
            priv.started = true
            if (this.onStart)
                this.onStart()
        }
        if (xys.length == 3) {
            xys.shift()
        }
        let canAddPoint = true
        const newPoint = [
            e.offsetX,
            e.offsetY,
        ]
        if (this._testTrackMousePoint)
            this._testTrackMousePoint.push(newPoint)
        if (xys.length) {
            const lastPoint = xys[xys.length - 1]
            const dist = pdist(lastPoint, newPoint)
            if (dist < 1)
                canAddPoint = false
        }
        if (canAddPoint) {
            xys.push(newPoint)
        }
        if (!canAddPoint)
            return
        if(xys.length > 1) {
            if (distances.length == 10)
                distances.shift()
            distances.push(pdist(xys[xys.length - 1], xys[xys.length - 2]))
        }
        if (xys.length >= 3) {
            const minDist = Math.max(1, sumSq(...distances) ** 0.5 / distances.length)
            // const speedFactor = 1 - (1 / (minDist / 10 + 1))
            const value = (minDist - 5) / 2
            const speedFactor = (value / ((value ** 2 + 1) ** 0.5) + 1) / 2 - 0.052
            const bx = normalize([
                xys[1][0] - xys[0][0],
                xys[1][1] - xys[0][1],
            ])
            const by = [-bx[1], bx[0]]
            const p = normalize([
                xys[2][0] - xys[1][0],
                xys[2][1] - xys[1][1],
            ])
            let cos = bx[0] * p[0] + bx[1] * p[1]
            let sin = by[0] * p[0] + by[1] * p[1]
            const angle = Math.atan2(sin, cos)
            sin = Math.sin(angle * speedFactor)
            cos = Math.cos(angle * speedFactor)
            const m = this.obj.matrix.elements
            const cb = ((priv.keyState + 1) % 3) * 4
            const ca = ((priv.keyState + 2) % 3) * 4
            for (let it = 0; it < 4; it++) {
                const a = m[ca + it]
                const b = m[cb + it]
                m[ca + it] = + a * cos + b * sin
                m[cb + it] = - a * sin + b * cos
            }

            if (this.onUpdateMatrix)
                this.onUpdateMatrix(m)
        }
    }

    handleMouseUp(e) {
        const priv = this.#private
        if (priv.keyState == STATE.NONE)
            return
        priv.mouseDown = false
        priv.xys.length = 0
        priv.distances.length = 0
        if (priv.keyState != STATE.NONE) {
            if (this.onStop && priv.started)
                this.onStop()
        }
    }

    handleKeyDown(event) {
        const priv = this.#private
        if (!this.enabled)
            return
        if (priv.keyState !== STATE.NONE) {
            return
        } else if (this.keys[STATE.AROUND_X].indexOf(event.code) >= 0) {
            priv.keyState = STATE.AROUND_X
        } else if (this.keys[STATE.AROUND_Y].indexOf(event.code) >= 0) {
            priv.keyState = STATE.AROUND_Y
        } else if (this.keys[STATE.AROUND_Z].indexOf(event.code) >= 0) {
            priv.keyState = STATE.AROUND_Z
        }
        if (priv.keyState != STATE.NONE) {
            if (this.onKeyStateChanged)
                this.onKeyStateChanged(priv.keyState)
            window.removeEventListener("keydown", priv.keydownHandler)
            priv.xys.length = 0
            priv.distances.length = 0
            priv.key = event.code
        }
    }

    handleKeyUp(event) {
        const priv = this.#private
        if (!this.enabled)
            return
        if (priv.keyState != STATE.NONE && priv.key == event.code) {
            priv.xys.length = 0
            priv.distances.length = 0
            priv.keyState = STATE.NONE
            if (this.onKeyStateChanged)
                this.onKeyStateChanged(priv.keyState)
            window.addEventListener("keydown", priv.keydownHandler)
            if (priv.mouseDown == true) {
                if (this.onStop && priv.started)
                    this.onStop()
            }
        }
    }

    test() {
        const priv = this.#private
        priv.keyState = STATE.AROUND_X
        priv.mouseDown = true
        const data = [[208, 123], [207, 123], [206, 123], [204, 123], [200, 124], [196, 127], [192, 131], [188, 138], [179, 151], [172, 166], [169, 171], [168, 177], [165, 184], [164, 191], [164, 196], [164, 202], [166, 209], [170, 218], [176, 226], [182, 234], [188, 241], [196, 247], [202, 254], [208, 258], [214, 260], [220, 262], [225, 263], [232, 263], [239, 261], [246, 259], [252, 257], [257, 255], [262, 251], [267, 246], [270, 239], [272, 233], [274, 226], [274, 218], [274, 211], [274, 203], [272, 195], [270, 186], [268, 178], [266, 171], [264, 165], [260, 156], [260, 154], [258, 152], [257, 150], [256, 149], [256, 147], [256, 147]]
        for (let p of data) {
            this.handleMouseMove({
                offsetX: p[0],
                offsetY: p[1],
            })
        }
    }
}

function pdist(p1, p2) {
    return ((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2) ** 0.5
}

function sumSq(...params) {
    let r = 0
    for (let x of params)
        r += x*x
    return r
}
