<script lang="ts">
import { computed, defineComponent, reactive, ref } from '@vue/composition-api'
import HourPicker from "@/components/pickers/HourPicker.vue"

export interface Shift {
	start: number,
	end: number,
	duration: number
}

export default defineComponent({
	components: {
		HourPicker
	},
	setup(props, { emit }) {
		let shift = reactive({
			start: 7,
			end: 19,
			duration: 12
		})

		let displayed_end = computed(() => shift.end ? shift.end : 24)

		//if user changes the start, keep duration the same and set end accordingly
		let inputStart = () => {
			shift.start = Math.round(Math.abs(shift.start + 24)) % 24;
			shift.end = (shift.duration + shift.start) % 24;
			emit("input", shift)
		}
		//if user changes end, decrease duration and keep start the same
		let inputEnd = (end_new: number) => {
			shift.end = Math.round(Math.abs(Number(end_new) + 24)) % 24;
			shift.duration = (shift.start < shift.end ? 0 : 24) + shift.end - shift.start;
			emit("input", shift)
		}

		return {
			shift,
			displayed_end,
			inputStart,
			inputEnd
		}
	},
})
</script>

<template>
	<div>
		<hour-picker v-model.number="shift.start" @input="inputStart" />
		<span>-</span>
		<hour-picker :value="displayed_end" @input="inputEnd" :hour24="true" />
	</div>
</template>

<style scoped>
div {
	display: flex;
	gap: inherit;
	align-items: center;
}
/* div > * {
	padding: 0 7.5px;
}
div:first-child {
	padding-left: 0;
}
div:last-child {
	padding-right: 0;
} */
</style>
