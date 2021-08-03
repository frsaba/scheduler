import { ref, Ref, reactive, watch, computed } from "@vue/composition-api"

export default function track(subjects: Ref<Array<Element>>,) {
    let observer: IntersectionObserver = new IntersectionObserver(() => { })
    let visibility = ref(new Array<Ref<boolean>>())
    let visibility_threshold = 0.15
    let bounds = ref(new DOMRect());

    let callback: IntersectionObserverCallback = (entries) => {
        for (let entry of entries) {
            let i = subjects.value.findIndex((e) => e == entry.target)
            let visible = entry.intersectionRatio > visibility_threshold
            visibility.value[i].value = visible

            bounds.value = entry.rootBounds as DOMRect
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

    function isVisible(element : Element) {
        let i = subjects.value.findIndex((e) => e == element)   
        return visibility.value[i].value
    }

    return {
        createObserver,
        visibility,
        anyVisible,
        bounds,
        isVisible
    }
}