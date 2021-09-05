import { ref, Ref, watch, computed, } from "@vue/composition-api"
import _ from "lodash"

type Entry = Ref<IntersectionObserverEntry | null>

export default function track(subjects: Ref<Array<Element>>,) {
	let observer: IntersectionObserver = new IntersectionObserver(() => { })
	let scrollCallback: ((entries: IntersectionObserverEntry[]) => void) | null
	let visibility = ref(new Array<Entry>())
	let _visibility_threshold = 0.15

	let callback: IntersectionObserverCallback = (entries) => {
		for (let entry of entries) {
			let i = subjects.value.findIndex((e) => e == entry.target)
			visibility.value[i].value = entry
		}
		if (scrollCallback && visibility.value.every(x => x.value)) {
			scrollCallback(visibility.value.map(x => x.value) as IntersectionObserverEntry[])
			scrollCallback = null
		}
	}

	watch(subjects, (fresh, stale) => {
		observer.disconnect()
		visibility.value = Array.from({ length: fresh.length }, _ => ref(null));

		for (let s of fresh) {
			observer.observe(s)
		}
	})

	const anyVisible = computed(() => {
		return visibility.value.some((e) => e.value == null || e.value.intersectionRatio > _visibility_threshold)
	})

	function createObserver(root: Element, margin: string, visibility_threshold = 0.15) {
		observer = new IntersectionObserver(callback, {
			root, rootMargin: margin,
			threshold: [0.1, 0.9]
		})
		_visibility_threshold = visibility_threshold
	}

	function scrollIntoView(entries: IntersectionObserverEntry[], scroll: (dx: number, dy: number) => void, padding = 0) {
		let { rootBounds: root, boundingClientRect: start } = entries[0]
		let { boundingClientRect: end } = _.last(entries)!
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

	function registerScroll(element: Element | Element[], scroll: (dx: number, dy: number) => void, padding = 0) {
		scrollCallback = (entries) => scrollIntoView(entries, scroll, padding)
	}

	return {
		createObserver,
		visibility,
		anyVisible,
		scrollIntoView: registerScroll
	}
}