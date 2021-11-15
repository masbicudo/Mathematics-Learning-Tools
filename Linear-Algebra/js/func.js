/**
 * 
 * @param  {...function} functions 
 * @returns {function|null}
 */
export function combine(...functions) {
    let fns = []
    for (let fn of functions) {
        if (typeof fn === "function") {
            if (fn.type == "combination")
                fns.push(...fn.functions)
            else
                fns.push(fn)
        }
    }
    if (fns.length == 0)
        return null
    if (fns.length == 1)
        return fns[0]
    function combined(...params) {
        for (let fn of fns)
            fn(...params)
    }
    combined.type = "combination"
    combined.functions = fns
    return combined
}

/**
 * 
 * @param {function|null} func 
 * @param  {...any} args 
 * @returns 
 */
export function call(func, ...args) {
    return func(...args)
}
