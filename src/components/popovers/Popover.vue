<script lang="ts">
import Vue from "vue";
import { DayType, DayTypeDescriptions } from "@/model/day-types";
import LeaveButton from "@/components/popovers/LeaveButton.vue";
import ShiftPicker, { Shift } from "@/components/pickers/ShiftPicker.vue";
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
		ShiftPicker,
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
			shift: {start: 7, end: 19, duration: 12} as Shift,
			leave_buttons: [DayType.paid, DayType.freeday, DayType.nonworking_day, DayType.weekend, DayType.sick, DayType.holiday] as DayType[],
			accelerators: ["f", "s", "p", "h", "t", "ü", "Delete", "Enter", "Escape"], //Last three are used only in IgnoreKeys
			last_action: ""
		};
	},
	computed: {
		desc() {
			return DayTypeDescriptions
		},
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
			if (!this.value) return;
			let k = e.key
			//Arrow key, Ctrl + *, any single letter, any accelerator
			if (k.startsWith("Arrow") || e.ctrlKey || (k.length == 1 && k.toLowerCase() != k.toUpperCase()) || this.accelerators.includes(k))
				e.preventDefault()
		},
		setShift(shift: Shift, newBatch: boolean = false) {
			this.shift = shift
			if (this.last_action !== "set-shift" || newBatch) {
				this.newBatch()
			}

			this.$emit('set-shift', shift)
			this.last_action = "set-shift"
		},
		setType(type: DayType) {
			this.newBatch()
			this.$emit('set-type', type)
			this.last_action = "set-type"
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
		:offset="{x: 0, y: 12}"
		ref="base">
		<v-card class="card" ref="card">
			<span class="close-button">
				<leave-button plain color="secondary" @click="close" x-small elevation="0" tooltip="Bezárás" accelerator="Escape">
					<v-icon>mdi-close</v-icon>
				</leave-button>
			</span>
			<div class="upper">
				<shift-picker @input="setShift">
				</shift-picker>

				<leave-button :type="0" @click="setShift(shift, true)" tooltip="Műszak" accelerator="Enter">
					<v-icon>mdi-set-split</v-icon>
				</leave-button>
				<leave-button :type="8" @click="setType" dark tooltip="Törlés" color="red" accelerator="Delete">
					<v-icon>mdi-delete</v-icon>
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
}
.upper {
	gap: 15px;
	justify-content: center;
}
.lower {
	gap: 8px;
	justify-content: space-between;
}

.close-button {
	position: absolute;
	top: 0;
	right: 0;
	color: red;
}
</style>