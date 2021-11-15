export function* zip(iterablesList, options) {
    const iterables = [...iterablesList]
    const hasOptions = options !== null && options !== undefined
    const hasModeOption = hasOptions && "mode" in options
    const inner = hasModeOption ? options.mode == "inner" : true
    const outer = hasModeOption ? options.mode == "outer" : false
    const repeat = hasModeOption ? options.mode == "repeat" : false
    const length = iterables.length
    const iters = iterables.map(x => iter(x))
    const z = []
    z.length = length
    while (true) {
        let doneCount = 0
        for (let z_it = 0; z_it < length; z_it++) {
            let next = iters[z_it].next()
            if (inner && next.done) return
            if (outer && next.done) doneCount++
            if (repeat && next.done) {
                iters[z_it] = iter(iterables[z_it])
                next = iters[z_it].next()
                if (next.done)
                    throw new Error("Sequence is empty, cannot zip repeat")
            }
            z[z_it] = next.value
        }
        if (doneCount == length) return
        yield [...z]
    }
}

function* iter(gen) {
    yield* gen
}

export function* range(length) {
    for (let it = 0; it < length; it++)
        yield it
}

export function* reverseRange(length) {
    for (let it = length; it > 0; it--)
        yield it - 1
}

export function* iterArray(array, iterator) {
    for (let ix of iterator)
        yield array[ix]
}
