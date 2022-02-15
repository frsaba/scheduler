<script lang="ts">
import { computed, defineComponent, ref, watch } from '@vue/composition-api'
import { ipcRenderer } from "electron"
import _ from "lodash"

export default defineComponent({
	props: {
		value: {
			type: Boolean,
			default: false,
		},
		targets: {
			type: Array as () => Array<Element>,
			default: () => []
		},
		offset: {
			type: Object as () => { x: number, y: number },
			default: () => ({ x: 0, y: 0 })
		},
		position: {
			type: Object as () => { x: number, y: number },
			default: () => ({ x: 0, y: 0 })
		},
		absolute: {
			type: Boolean,
			default: false
		},
		margin: {
			type: Number,
			default: 10
		}
	},
	setup(props, { root }) {
		// TODO: (maybe) average x, lowest y
		let targetStartRect = ref(new DOMRect());
		let targetEndRect = ref(new DOMRect());

		let updateRects = () => {
			if (props.targets.length === 0) return;
			targetStartRect.value = _.first(props.targets)!.getBoundingClientRect()
			targetEndRect.value = _.last(props.targets)!.getBoundingClientRect()
		}

		const popover = ref() // Template ref to popover

		let updateDimensions = () => {
			let rect = popover.value?.getBoundingClientRect();
			popoverWidth.value = rect?.width ?? 0;
			popoverHeight.value = rect?.height ?? 0;
		}

		ipcRenderer.on("zoom", updateRects)

		let popoverWidth = ref(100);
		let popoverHeight = ref(100);

		let x = computed(() => {
			let { offset: { x: offset }, margin, position, absolute } = props;
			let maxLeft = window.innerWidth - popoverWidth.value - margin;

			let res = -1;
			if (absolute)
				res = position.x;
			else {
				if (!targetStartRect.value || !targetEndRect.value) return offset
				let { left } = targetStartRect.value
				let { right } = targetEndRect.value
				res = left + (right - left - popoverWidth.value) / 2 + offset;
				position.x = res;
			}

			return _.clamp(res, margin, maxLeft);
		})

		let y = computed(() => {
			let { offset: { y: offset }, margin, position, absolute } = props;
			let maxTop = window.innerHeight - popoverHeight.value - margin;

			let res = -1;
			if (absolute)
				res = position.y;
			else {
				if (!targetStartRect.value) return offset
				let { bottom, top } = targetStartRect.value

				// If the popover would cover the target move the popover above it
				if (bottom > maxTop)
					res = top - offset - popoverHeight.value;
				else
					res = bottom + offset;

				position.y = res;
			}

			return _.clamp(res, margin, maxTop);
		})

		let style = computed(() => {
			return {
				left: x.value + "px",
				top: y.value + "px",
				visibility: props.value ? "visible" : "hidden",
				opacity: props.value ? "1" : "0",
				cursor: props.absolute ? "grab" : "default",
				transitionDuration: drag.dragging ? "0ms" : "300ms"
			}
		})

		let drag = {
			offset: {
				x: 0,
				y: 0
			},
			dragging: false
		}

		let dragStart = (e: MouseEvent) => {
			drag.dragging = true;
			let rect: DOMRect = popover.value?.getBoundingClientRect();
			drag.offset.x = e.x - rect.x
			drag.offset.y = e.y - rect.y
		}

		window.addEventListener("mousemove", (e) => {
			let { position, absolute } = props;
			if (!drag.dragging || !absolute ) return;
			e.preventDefault()
			position.x = e.pageX - drag.offset.x;
			position.y = e.pageY - drag.offset.y;
		})

		window.addEventListener("mouseup", (e) => {
			console.log("mouseup")

			drag.dragging = false;
		})

		watch(() => props.targets, () => {
			updateRects()
			root.$nextTick(updateDimensions)
		})

		return {
			x, y, style, popoverWidth, popoverHeight, updateRects, popover,
			dragStart
		}
	},
})
</script>

<template>
	<div
		class="popover"
		@mousedown="dragStart"
		:style="style"
		ref="popover">
		<slot></slot>
	</div>
</template>

<style scoped>
.popover {
	position: fixed;
	z-index: 5;
	transition-property: left, top, visibility, opacity;
	transition-delay: 0ms, 0ms, 100ms, 100ms;
}
</style>
