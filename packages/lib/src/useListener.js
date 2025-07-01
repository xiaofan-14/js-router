export function useListener(){
    const defaultTarget = window

    function isValidTarget(target) {
        return target && typeof target.addEventListener === 'function'
    }

    function addListener(target, trigger, callback) {
        const el = target || defaultTarget
        if (!isValidTarget(el)) return
        el.addEventListener(trigger, callback)
    }

    function removeListener(target, trigger, callback) {
        const el = target || defaultTarget
        if (!isValidTarget(el)) return
        el.removeEventListener(trigger, callback)
    }

    return {
        addListener,
        removeListener,
    }
}