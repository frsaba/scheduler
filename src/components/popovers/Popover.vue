<script lang="ts">
import Vue from "vue";
import { DayType, DayTypeDescriptions } from "@/model/day-types";
import LeaveButton from "@/components/popovers/LeaveButton.vue";
import HourPicker from "@/components/popovers/HourPicker.vue";
import BasePopover from "@/components/BasePopover.vue";

interface LeaveButtonData {
	type: string,
	color: string,
	tooltip: string,
	label: string
}

export default Vue.extend({
	name: "Popover",
	components: {
		LeaveButton,
		HourPicker,
		BasePopover
	},
	props: {
		value: {
			type: Boolean,
			default: false,
		},
		selection_elements: {
			type: Array as () => Array<Element>,
			default: () => []
		},
	},
	data() {
		return {
			shift_start: 8,
			shift_end: 16,
			shift_duration: 8,
			leave_buttons: [DayType.paid, DayType.unpaid, DayType.weekend, DayType.sick, DayType.holiday] as DayType[],
			accelerators: ["f", "s", "h", "t", "ü", "Delete", "Enter", "Escape"] //Last three are used only in IgnoreKeys
		};
	},
	computed: {
		desc() {
			return DayTypeDescriptions
		}
	},
	created() {
		window.addEventListener("keydown", this.ignoreKeys);
	},
	destroyed() {
		window.removeEventListener("keydown", this.ignoreKeys);
	},
	methods: {
		newBatch() {
			this.$store.dispatch('new_batch')
		},
		close() {
			this.$emit("close");
		},
		updateRects() {
			// @ts-ignore
			this.$refs.base.updateRects()
		},
		ignoreKeys(e: KeyboardEvent) {
			if(!this.value) return;
			let k = e.key
			//Arrow key, Ctrl + *, any single letter, any accelerator
			if (k.startsWith("Arrow") || e.ctrlKey || (k.length == 1 && k.toLowerCase() != k.toUpperCase()) || this.accelerators.includes(k))
				e.preventDefault()
		},
		//if user changes the start, keep duration the same and set shift_end accordingly
		inputStart() {
			this.shift_start = Math.round(Math.abs(this.shift_start + 24)) % 24;
			this.shift_end = (this.shift_duration + this.shift_start) % 24;
			this.setShift(false);
		},
		//if user changes end, decrease duration and keep shift_start the same
		inputEnd() {
			this.shift_end = Math.round(Math.abs(this.shift_end + 24)) % 24;
			this.shift_duration = (this.shift_start < this.shift_end ? 0 : 24) + this.shift_end - this.shift_start;
			this.setShift(false)
		},
		setShift(newBatch: boolean) {
			this.$emit('set-shift', { start: this.shift_start, duration: this.shift_duration })
			if (newBatch) this.newBatch()
		},
		setType(type: DayType) {
			this.$emit('set-type', type)
		},
	},
	watch: {
		selection_elements(prev: Element[], curr: Element[]) {
			this.newBatch()
		},
	}
});
</script>

<template>
	<base-popover
			v-model="value"
			:targets="selection_elements"
			:offset="{x: 0, y: 10}"
			ref="base">
		<v-card class="card" ref="card">
			<div class="upper">
				<hour-picker v-model.number="shift_start" @input="inputStart" />
				-
				<hour-picker v-model.number="shift_end" @input="inputEnd" />

				<leave-button :type="0" @click="setShift(true)" tooltip="Műszak" accelerator="Enter">
					<v-icon>mdi-set-split</v-icon>
				</leave-button>
				<leave-button :type="7" @click="setType" dark tooltip="Törlés" color="red" accelerator="Delete">
					<v-icon>mdi-delete</v-icon>
				</leave-button>
				<leave-button class="absolute" @click="close" x-small elevation="0" color="white" tooltip="Bezárás" accelerator="Escape">
					<v-icon>mdi-close</v-icon>
				</leave-button>
			</div>
			<div class="lower">
				<leave-button v-for="(b, i) in leave_buttons" dark :key="b" :type="b" @click="setType" :accelerator="accelerators[i]" />

			</div>
		</v-card>
	</base-popover>
</template>

<style scoped>
.card {
	border: 1px solid transparent;
	/* border: 1px solid grey; */
}
.v-text-field {
	width: 4em;
}
.upper,
.lower {
	margin: 1em;
	display: flex;
	align-items: center;
	gap: 10px;
	justify-content: space-between;
}

/* .absolute {
	position: absolute;
} */
</style>