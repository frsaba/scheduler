import { ref, Ref, reactive, watch, computed } from "@vue/composition-api"
import { bind } from "lodash"

interface TrackingHook {
    (entry: IntersectionObserverEntry): void
}

export default function track(subjects: Ref<Array<Element>>,) {
    let observer: IntersectionObserver = new IntersectionObserver(() => { })
    let visibility = ref(new Array<Ref<boolean>>())
    let visibility_threshold = 0.15
    let hooks = ref(new Array<TrackingHook | null>().fill(null))

    let callback: IntersectionObserverCallback = (entries) => {
        for (let entry of entries) {
            let i = subjects.value.findIndex((e) => e == entry.target)
            let visible = entry.intersectionRatio > visibility_threshold
            visibility.value[i].value = visible

            let hook = hooks.value[i]
            if (hook) {
                hook(entry)
                hooks.value[i] = null
            }
        }
    }

    watch(subjects, (fresh, stale) => {
        observer.disconnect()
        visibility.value = new Array((fresh.length)).fill(ref(false))
        for (let s of fresh) {
            observer.observe(s)
        }
    })

    const anyVisible = computed(() => visibility.value.some(e => e.value))

    function createObserver(root: Element, margin: string, visibility_threshold = 0.15) {
        observer = new IntersectionObserver(callback, {
            root, rootMargin: margin,
            threshold: [0.1, 0.2, 0.8, 0.9]
        })
    }

    async function scrollIntoView(element: Element, scroll: (dx: number, dy: number) => void, padding = 24) {
        let i = subjects.value.findIndex((e) => e == element)
        if (i == -1) throw "Element to scroll into view is not being observed" //TODO: add as a temporary subject

        hooks.value[i] = (entry: IntersectionObserverEntry) => {
            let { rootBounds: root, boundingClientRect: cell } = entry
            if (!root) return;
            let [dx, dy] = [0, 0]

            const bindings = {
                "left": [1, 0],
                "right": [-1, 0],
                "top": [0, 1],
                "bottom": [0, -1],
            }
            type directions = keyof typeof bindings;

            for (let [direction, [x, y]] of Object.entries(bindings)) {
                let distance = cell[direction as directions] - root[direction as directions]

                if (distance * x < 0) dx = distance - padding * x
                if (distance * y < 0) dy = distance - padding * y
            }

            scroll(dx, dy)
        }
    }

    return {
        createObserver,
        visibility,
        anyVisible,
        scrollIntoView
    }
}