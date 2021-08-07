import { ref, Ref, reactive, watch, computed } from "@vue/composition-api"
import _ from "lodash"

interface TrackingHook {
    (entry: IntersectionObserverEntry): void
}

interface DeferredPromise<Type> extends Promise<Type> {
    pending: boolean,
    resolve: (value: any) => {}
}

function Deferred<Type>() {
    let res, prom = new Promise<Type>(inner_res => {
        res = inner_res;
    }) as DeferredPromise<Type>;
    //@ts-ignore
    prom.resolve = res;
    prom.pending = true;
    prom.then(() => prom.pending = false)
    return prom;
}

export default function track(subjects: Ref<Array<Element>>,) {
    let observer: IntersectionObserver = new IntersectionObserver(() => { })
    let visibility = ref(new Array<Ref<DeferredPromise<IntersectionObserverEntry>>>())
    let _visibility_threshold = 0.15

    let callback: IntersectionObserverCallback = (entries) => {
        for (let entry of entries) {
            let i = subjects.value.findIndex((e) => e == entry.target)
            visibility.value[i].value.resolve(entry)
        }
    }

    watch(subjects, (fresh, stale) => {
        observer.disconnect()
        visibility.value = Array.from({ length: fresh.length }, _ => ref(Deferred<IntersectionObserverEntry>()));

        for (let s of fresh) {
            observer.observe(s)
        }
    })

    const anyVisible = computed(async () => {
        let entries = await Promise.all(visibility.value)
        return entries.some(async (e) => (await e.value).intersectionRatio > _visibility_threshold)
    }
    )

    function createObserver(root: Element, margin: string, visibility_threshold = 0.15) {
        observer = new IntersectionObserver(callback, {
            root, rootMargin: margin,
            threshold: [0.1, 0.2, 0.8, 0.9]
        })
        _visibility_threshold = visibility_threshold
    }

    async function scrollIntoView(element: Element | Element[], scroll: (dx: number, dy: number) => void, padding = 0) {
        let elements = ([] as Element[]).concat(element) as Element[]

        let entries = elements.map(e => visibility.value[subjects.value.findIndex((sub) => sub == e)])
        let done = await Promise.all(entries)

        let { rootBounds: root, boundingClientRect: start } = await done[0].value
        let { boundingClientRect: end } = await _.last(done)!.value
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
            let distance_start = start[direction as directions] - root[direction as directions];
            let distance_end = end[direction as directions] - root[direction as directions];

            let distance = [distance_start, distance_end].sort((a, b) => x * (a - b))[0]
            // if (direction == "left" || direction == "right")
            //     console.dir({ direction, start: start[direction as directions], end: end[direction as directions], root: root[direction as directions], distance })

            if (distance * x < 0) dx = distance - padding * x
            if (distance * y < 0) dy = distance - padding * y
        }

        scroll(dx, dy)
    }


    return {
        createObserver,
        visibility,
        anyVisible,
        scrollIntoView
    }
}