export class Matrix {
    constructor(shape, data, layout, sparse) {
        this.shape = shape
        this.data = data
        this.layout = layout
        this.sparse = sparse
    }
}

function dot_Mc3r2s_c2s(a, b) { return dot_c3r2s_c2s(a.data, b) }
function dot_Mc3r2s_c2s_at_b(a, b) { return dot_c3r2s_c2s_at_b(a.data, b) }
function dot_Mc3r2s_Mc2s(a, b) { return dot_c3r2s_c2s(a.data, b.data) }
function dot_c3r2s_c2s(a, b) { return dot_c3r2s_c2s_at_b(a, [...b]) }

function dot_c3r2s_c2s_at_b(a, b) {
    const b_0_ = b[0]
    const b_1_ = b[1]
    b[0] = a[0]*b_0_ + a[1]*b_1_
    b[1] = a[2]*b_0_ + a[3]*b_1_
    b[2] = a[4]*b_0_ + a[5]*b_1_
    return b
}

function dot_ScYrXs_cXs_at_b(a, b, Y, X) {
    const b_old = [...b]
    for (let b_sx in b) {
        let b_ix = 1 * b_sx
        if (!Number.isNaN(b_ix)) {
            b[b_sx] = 0
        }
    }
    b.length = Y
    for (let a_sx in a) {
        let a_ix = 1 * a_sx
        if (!Number.isNaN(a_ix)) {
            let a_v = a[a_ix]
            let a_col = a_ix % X
            let a_row = (a_ix - a_col) / X
            let b_v = b_old[a_col]
            if (b_v !== undefined)
                b[a_row] += a_v * b_v
        }
    }
    return b
}

function dot_r2c3s_c2s(a, b) {
    return [ // c3s
        a[0]*b[0] + a[3]*b[1],
        a[1]*b[0] + a[4]*b[1],
        a[2]*b[0] + a[5]*b[1],
    ]
}

function dot_ss_v2s(a0, a1, b) {
    return a0 * b[0] + a1 * b[1] // s
}

function dot_v2s_v2s(a, b) {
    return a[0] * b[0] + a[1] * b[1] // s
}

function add_c3s(a, b) {
    return [
        a[0] + b[0],
        a[1] + b[1],
        a[2] + b[2],
    ]
}

function mul_c3s(s, v) {
    return [
        s * v[0],
        s * v[1],
        s * v[2],
    ]
}

function eq_v2(a, b) {
    return a[0] == b[0] && a[1] == b[1]
}

export function dotSpec(a, b, options) {
    const hasOptions = options !== null && options !== undefined
    const inplaceB = hasOptions && options.inPlace === "second-argument"
    if (a instanceof Matrix && Array.isArray(b)) {
        if (a.shape[1] != b.length)
            throw new Error("a.shape[1] != b.length")
        if (a.layout == "row-major") {
            if (a.sparse === true || a.sparse === undefined && isSparse(a.data))
                return (a, b) => dot_ScYrXs_cXs_at_b(a.data, b, a.shape[0], a.shape[1])
            if (eq_v2(a.shape, [3, 2]) && b.length == 2)
                if (inplaceB) return dot_Mc3r2s_c2s_at_b
            return dot_Mc3r2s_c2s
        }
    }
}

export function dot(a, b, options) {
    const hasOptions = options !== null && options !== undefined
    const getFunction = hasOptions && options.getFunction == true
    const func = dotSpec(a, b, options)
    if (getFunction) return func
    return func(a, b)
}

let isSparse = a => a.reduce(x=>x+1,0)<a.length

export function rowVec(...params) {
    const s = isSparse(params)
    const m = new Matrix([1, params.length], [...params], "row-major", s)
    return m
}

export function colVec(...params) {
    const s = isSparse(params)
    const m = new Matrix([params.length, 1], [...params], "column-major", s)
    return m
}

export function mat(shape, data, layout) {
    const s = isSparse(data)
    const m = new Matrix(shape, data, layout, s)
    return m
}

export function diag(shape, diagonal, layout) {
    let sparse = []
    const maxSize = shape[0] * shape[1]
    const diagMap = layout == "row-major" ? shape[1] + 1 : shape[0] + 1
    for (let it = 0; it < diagonal.length && it * diagMap < maxSize; it++) {
        sparse[it * diagMap] = diagonal[it]
    }
    const m = new Matrix(shape, sparse, layout, true)
    return m
}

export function normalize(vector) {
    let sumOfSquares = 0
    for (let scalar of vector)
        sumOfSquares += scalar * scalar
    let normFactor = Math.sqrt(sumOfSquares)
    for (let it = 0; it < vector.length; it++)
        vector[it] /= normFactor
    return vector
}