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
		margin: {
			type: Number,
			default: 10
		}
	},
	setup(props, context) {
		// TODO: (maybe) average x, lowest y
		let targetStartRect = ref(new DOMRect());
		let targetEndRect = ref(new DOMRect());

		let updateRects = () => {
			if (props.targets.length === 0) return;
			targetStartRect.value = _.first(props.targets)!.getBoundingClientRect()
			targetEndRect.value = _.last(props.targets)!.getBoundingClientRect()
		}

		ipcRenderer.on("zoom", updateRects)

		let popoverWidth = ref(100);
		let popoverHeight = ref(100);

		let x = computed(() => {
			let { offset: { x: offset }, margin } = props;
			if (!targetStartRect.value || !targetEndRect.value) return offset
			let { left } = targetStartRect.value
			let { right } = targetEndRect.value
			let x = left + (right - left - popoverWidth.value) / 2 + offset;
			return _.clamp(x, margin, window.innerWidth - popoverWidth.value - margin)
		})

		let y = computed(() => {
			let { offset: { y: offset }, margin } = props;
			if (!targetStartRect.value) return offset
			let { bottom, top } = targetStartRect.value

			// If the popover would cover the target move the popover above it
			let maxTop = window.innerHeight - popoverHeight.value - margin
			if (bottom > maxTop)
				return top - offset - popoverHeight.value

			return _.clamp(bottom + offset, margin, maxTop)
		})

		let style = computed(() => {
			return {
				left: x.value + "px",
				top: y.value + "px",
				visibility: props.value ? "visible" : "hidden",
				opacity: props.value ? "1" : "0"
			}
		})

		watch(() => props.targets, updateRects)

		return {
			x, y, style, popoverWidth, popoverHeight, updateRects
		}
	},
	mounted() {
		setTimeout(() => {
			let rect = (this.$refs.popover as Element)?.getBoundingClientRect();
			this.popoverWidth = rect.width;
			this.popoverHeight = rect.height;
		}, 1000)
	}
})
</script>

<template>
	<div class="popover" :style="style" ref="popover">
		<slot></slot>
	</div>
</template>

<style scoped>
.popover {
	position: fixed;
	z-index: 1000;
	transition-property: left, top, visibility, opacity;
	transition-duration: 300ms;
	/* transition-timing-function: ease-in; */
	transition-delay: 0ms, 0ms, 100ms, 100ms;
	/* transition-timing-function: ease-in-out; */
}
</style>
