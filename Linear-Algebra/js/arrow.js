import { dotSpec, Matrix, normalize } from "./linalg.js"
import { range, iterArray, reverseRange } from "./iter.js"

const PI_2 = 2*Math.PI

class Vertex {
    constructor(position) {
        this.index = -1
        this.position = position
        this.normal = null
    }
    get x() { return this.position[0] }
    get y() { return this.position[1] }
    get z() { return this.position[2] }
    get w() { return this.position[3] }
    set x(value) { this.position[0] = value }
    set y(value) { this.position[1] = value }
    set z(value) { this.position[2] = value }
    set w(value) { this.position[3] = value }
}

export class Arrow {
    constructor(
        length = 1,
        headLength = 0.25,
        smallRadius = 0.125,
        largeRadius = 0.15,
        angularSteps = 32,
        bodySteps = 128,
        headSteps = 32,
    ) {
        /** @type {Vertex[]} */
        const vertices = []

        /** @type {number[]} */
        const triangles = []

        // angular and tangential details levels

        // Arrow Model:
        // - disc
        // - cylinder
        // - disc with hole
        // - cone


        // arrow body back -> disc
        //
        //      The back of the arrow is a simple disk. It is composed of a central
        //  vertices, and multiple vertices for the border.
        const baseDisk = new SimpleDisk(
            smallRadius, // radius
            angularSteps, // border points
        )
        const matMoveDisk = new Matrix(
            [3, 2], // shape
            [ // data
                +1, .0,
                .0, -1,
                .0, .0,
            ],
            "row-major", // type
        )
        // getting a dot-product function for the given types
        let myDot = dotSpec(
            matMoveDisk,
            [0, 0],
            { inPlace: "second-argument" },
        )
        for (let v of baseDisk.getTriangles()) {
            if (v.index < 0) {
                // adding vertex
                v.index = vertices.length
                vertices.push(v)

                // transforming vertex
                v.normal = [0, 0, -1]
                myDot(matMoveDisk, v.position)
            }
            triangles.push(v.index)
        }

        // arrow body -> cylinder
        //
        //      The cylinder will be created by transforming a square.
        //  First we create a square in the range (0,PI)x(0,L).
        //  The x axis will be the angle, and the y axis will be the height.
        //  Both of these will have multiple divisions so that we can distort
        //  the shape of the arrow later.
        //      Vertices are organized in memory as layers of the cylinder.
        //  These layers are formed by dividing the length of the arrow, each
        //  one being a circle.
        const arrowBodyLength = length - headLength
        const cylinder = new Square(
            angularSteps, // x steps
            bodySteps, // y steps
            PI_2, // width
            arrowBodyLength, // height
            false, // include right border
            true, // include top border
        )
        const cylinderVertices = cylinder.getVertices(
            "left-to-right",
            "bottom-up",
        )
        for (let v of cylinderVertices) {
            // adding vertex
            v.index = vertices.length
            vertices.push(v)

            // transforming vertex
            let a = v.x
            let h = v.y
            let r = smallRadius
            v.x = r * Math.cos(a)
            v.y = r * Math.sin(a)
            v.z = h
            v.normal = [v.x, v.y, 0]
        }
        const cylinderTriangles = cylinder.getTriangles(
            "left-to-right",
            "bottom-up",
            "x-closed",
        )
        // adding triangle vertex indices
        for (let v of cylinderTriangles) {
            triangles.push(v.index)
        }

        // arrow head back -> hollow disk
        //
        //      The back of the arrow head if formed by a hollow disk.
        //  The inner hole coincides with the last cylinder layer. The outer
        //  circle will coincide with the base of a cone.
        //      The shape will be constructed by distorting a square. The x axis
        //  represents the angle, and the y axis the distance from the center.
        const hollowDisk = new Square(
            angularSteps, // x steps
            2, // y steps
            PI_2, // width -> angle
            1.0, // height -> will be mapped to (smallRadius, largeRadius)
            false, // include right border
            true, // include top border
        )
        // offsetting odd rows so that we get better aligned triangles
        const hollowDiskOddOffset = 0.5 * (PI_2 / angularSteps)
        for (let row_it = 1; row_it < hollowDisk.rows.length; row_it += 2) {
            for (let v of hollowDisk.rows[row_it]) {
                v.x -= hollowDiskOddOffset
            }
        }
        const hollowDiskVertices = hollowDisk.getVertices(
            "left-to-right",
            "bottom-up",
        )
        for (let v of hollowDiskVertices) {
            // adding vertex
            v.index = vertices.length
            vertices.push(v)

            // transforming vertex
            let a = v.x
            let d = v.y
            let r = smallRadius * (1 - d) + largeRadius * d
            v.x = r * Math.cos(a)
            v.y = r * Math.sin(a)
            v.z = arrowBodyLength
            v.normal = [0, 0, -1]
        }
        const hollowDiskTriangles = hollowDisk.getTriangles(
            "left-to-right",
            "bottom-up",
            "x-closed",
        )
        // adding triangle vertices indices
        for (let v of hollowDiskTriangles) {
            triangles.push(v.index)
        }

        // arrow head cone - multi-layered cone
        //
        //      The arrow head cone is a cone with multiple layers. The bottom
        //  layer is the largest circle, and the top layer will be the smallest
        //  circle. At the tip of the arrow, there will be a single point.
        const cone = new Square(
            angularSteps, // x steps
            headSteps, // y steps
            PI_2, // width -> angle
            1, // height -> will be mapped to (0, headLength)
            false, // include right border
            false, // include top border (here it is false, because we will replace
                // top border by a single point, that is the tip of the arrow)
        )
        const coneVertices = cone.getVertices(
            "left-to-right",
            "bottom-up",
        )
        const normal00 = new Vertex(
            normalize([
                headLength,
                0,
                largeRadius,
            ]))
        for (let v of coneVertices) {
            // adding vertex
            v.index = vertices.length
            vertices.push(v)

            // transforming vertex
            let a = v.x
            let t = v.y
            let h = t * headLength
            let r = (1 - t) * largeRadius
            v.x = r * Math.cos(a)
            v.y = r * Math.sin(a)
            v.z = arrowBodyLength + h
            let normal = [
                normal00.x * Math.cos(a),
                normal00.x * Math.sin(a),
                normal00.z,
            ]
            v.normal = normal
        }
        const arrowTip = new Vertex([0,0,length])
        arrowTip.normal = [0,0,1]
        // adding arrowTip
        arrowTip.index = vertices.length
        vertices.push(arrowTip)
        
        const coneTriangles = cone.getTriangles(
            "left-to-right",
            "bottom-up",
            "x-closed",
        )
        // adding triangle vertices indices
        for (let v of coneTriangles) {
            triangles.push(v.index)
        }
        // adding tip of cone
        const coneTopRow = cone.rows[cone.rows.length - 1]
        for (let it = 0; it < coneTopRow.length; it++) {
            let v1 = coneTopRow[it]
            let v2 = coneTopRow[(it + 1) % coneTopRow.length]
            triangles.push(
                    arrowTip.index,
                    v1.index,
                    v2.index,
                )
        }

        this.vertices = vertices
        this.triangles = triangles
    }

    *getPositions() {
        for (let v of this.vertices)
            yield* v.position
    }

    *getNormals() {
        for (let v of this.vertices)
            yield* v.normal
    }
}

class SimpleDisk {
    /**
     * 
     * @param {number} radius 
     * @param {number} borderPointCount 
     */
    constructor(
        radius,
        borderPointCount,
    ) {
        this.center = new Vertex([0, 0])
        this.circle = [] // each element in this array is a vertex
        for (let point_it = 0; point_it < borderPointCount; point_it++) {
            const a = PI_2 * (point_it / borderPointCount)
            const x = radius * Math.cos(a)
            const y = radius * Math.sin(a)
            this.circle.push(new Vertex([x, y]))
        }
        Object.freeze(this)
        Object.freeze(this.circle)
    }

    *getTriangleFan() {
        yield this.center
        yield * this.circle
        yield this.circle[0]
    }

    *getTriangles() {
        for (let x = 0; x < this.circle.length; x++) {
            yield this.center
            yield this.circle[x]
            yield this.circle[(x + 1) % this.circle.length]
        }
    }
}

class Square {
    /**
     * 
     * @param {number} xSteps 
     * @param {number} ySteps 
     * @param {number} width 
     * @param {number} height 
     * @param {boolean} xInclusive 
     * @param {boolean} yInclusive 
     */
    constructor(
        xSteps,
        ySteps,
        width,
        height,
        xInclusive,
        yInclusive,
    ) {
        xInclusive = !!xInclusive
        yInclusive = !!yInclusive
        this.rows = []
        for (let y_it = 0; y_it < ySteps + yInclusive; y_it++) {
            let row = []
            for (let x_it = 0; x_it < xSteps + xInclusive; x_it++) {
                let x = width * (x_it / xSteps)
                let y = height * (y_it / ySteps)
                row.push(new Vertex([x, y]))
            }
            this.rows.push(row)
        }
        Object.freeze(this)
        Object.freeze(this.rows)
    }

    *getVertices(direction1, direction2) {
        if (direction1 == "left-to-right" || direction1 == "right-to-left") {
            const colRange = direction1 == "left-to-right" ? range
                : direction2 == "right-to-left" ? reverseRange
                : null
            const rowRange = direction2 == "bottom-up" ? range
                : direction2 == "top-down" ? reverseRange
                : null
            for (let row of iterArray(this.rows, rowRange(this.rows.length))) {
                yield* iterArray(row, colRange(row.length))
            }
        }
    }

    *getTriangles(direction1, direction2, ...options) {
        const xOpen = options.indexOf("x-closed") < 0
        const yOpen = options.indexOf("y-closed") < 0
        if (direction1 == "left-to-right") {
            if (direction2 == "bottom-up") {
                for (let row_it = 0; row_it < this.rows.length - yOpen; row_it++) {
                    const row0 = this.rows[row_it]
                    const row1 = this.rows[(row_it + 1) % this.rows.length]
                    for (let col_it = 0; col_it < row0.length - xOpen; col_it++) {
                        const col0 = col_it
                        const col1 = (col_it + 1) % row0.length
                        const p00 = row0[col0]
                        const p01 = row0[col1]
                        const p10 = row1[col0]
                        const p11 = row1[col1]
                        // read order will be:
                        // p00, p01, p10, p11
                        // preferred memory organization is row-major
                        // first triangle of pair
                        yield p00
                        yield p01
                        yield p10
                        // second triangle of pair
                        yield p11
                        yield p10
                        yield p01
                    }
                }
            }
        }
    }
}

class DetailedTriangle {
    constructor(layersPointCounts) {

    }
}

class HollowDisk {
    constructor(
        holeRadius,
        outerRadius,
        borderPointCount,
    ) {
        const shells = [] // 0 - inner circle; 1 - outer circle
        for (let shell_it = 0; shell_it < 2; shell_it++) {
            const currentShell = [] // each element in this array is a point
            const r = shell_it == 0 ? holeRadius : outerRadius
            for (let point_it = 0; point_it < borderPointCount; point_it++) {
                const a = PI_2 * (point_it + (0 - shell_it) * 0.5) / borderPointCount
                const x = r * Math.cos(a)
                const y = r * Math.sin(a)
                currentShell.push([x, y])
            }
            shells.push(currentShell)
        }
        return shells
    }
    linkSimpleHollowDiskTriangleStrip(
        positions,
        simpleDisk,
    ) {
        const strip = []
        const length = simpleDisk[0].length
        for (let it = 0; it <= length; it++) {
            // inner point
            let inner = simpleDisk[0][it % length]
            inner = indexPoint(positions, inner)
            strip.push(inner)
            simpleDisk[0][it % length] = inner

            // outer point
            let outer = simpleDisk[1][it % length]
            outer = indexPoint(positions, outer)
            strip.push(outer)
            simpleDisk[1][it % length] = outer
        }
        return strip
    }
}
