<script lang="ts">
import Vue from "vue";
import { DayType, DayTypeDescriptions } from "@/model/day-types";
import LeaveButton from "@/components/LeaveButton.vue";
import HourPicker from "@/components/HourPicker.vue";
import { ipcRenderer } from "electron";

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
		HourPicker
	},
	props: {
		value: {
			type: Boolean,
			default: false,
		},
		selected_start: DOMRect,
		selected_end: DOMRect,
	},
	data() {
		return {
			shift_start: 8,
			shift_end: 16,
			shift_duration: 8,
			last_width: 500,
			skipTransition: false,
			leave_buttons: [DayType.paid, DayType.unpaid, DayType.weekend, DayType.sick, DayType.holiday] as DayType[],
			accelerators: ["f", "s", "h", "t", "ü", "Delete", "Enter", "Escape"] //Last three are used only in IgnoreKeys
		};
	},
	computed: {
		x(): number {
			return (this.selected_start.x + (this.selected_end.x + this.selected_end.width - this.selected_start.x - this.width()) / 2);
		},
		y(): number {
			return this.selected_start.y + this.selected_start.height + 5;
		},
		desc() {
			return DayTypeDescriptions
		}
	},
	created() {
		window.addEventListener("keydown", this.ignoreKeys);

		ipcRenderer.on("zoom", () => {
			this.skipTransition = true
		})
	},
	destroyed() {
		window.removeEventListener("keydown", this.ignoreKeys);
		// ipcRenderer.removeAllListeners("zoom");
	},
	methods: {
		newBatch() {
			this.$store.dispatch('new_batch')
		},
		close() {
			this.$emit("close");
		},
		ignoreKeys(e: KeyboardEvent) {
			let k = e.key
			//Arrow key, Ctrl + *, any single letter, any accelerator
			if (k.startsWith("Arrow") || e.ctrlKey || (k.length == 1 && k.toLowerCase() != k.toUpperCase()) || this.accelerators.includes(k))
				e.preventDefault()
		},
		//if user changes the start, keep duration the same and set shift_end accordingly
		inputStart() {
			this.shift_start = Math.abs(this.shift_start + 24) % 24;
			this.shift_end = (this.shift_duration + this.shift_start) % 24;
			this.setShift(false);
		},
		//if user changes end, decrease duration and keep shift_start the same
		inputEnd() {
			this.shift_end = Math.abs(this.shift_end + 24) % 24;
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
		card_rect_width(): number {
			let element = this.$refs.card as Vue
			if (element) {
				return element.$el.getBoundingClientRect().width;
			}
			return 0;
		},
		width(): number {
			if (this.card_rect_width() != 0) {
				this.last_width = this.card_rect_width();
			}
			return this.last_width
		},
		transition() {
			//transitions are not normally applied when popover is moved, so visibility is toggled
			if(this.value){
				this.$emit('input', false);
				this.$nextTick(() => {
					this.$emit('input', true);
				});
			}
		},
	},
	watch: {
		selected_start(prev: DOMRect, curr: DOMRect) {
			if (this.skipTransition) return;

			if (prev.x !== curr.x || prev.y !== curr.y) { // If not in the same place
				this.transition()
				this.newBatch()
			}
		},
		selected_end(prev: DOMRect, curr: DOMRect) {
			if (this.skipTransition) {
				this.skipTransition = false;
				return;
			}

			if (prev.x !== curr.x || prev.y !== curr.y) { // If not in the same place
				this.transition()
				this.newBatch()
			}
		}
	}
});
</script>

<template>
	<v-menu
		:value="value"
		:close-on-content-click="false"
		:close-on-click="false"
		disable-keys
		:position-x="x"
		:position-y="y"
		absolute>
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
	</v-menu>
</template>

<style scoped>
/* .card {
	border: 1px solid grey;
} */
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
	flex-wrap: wrap;
}

/* .absolute {
	position: absolute;
} */
</style>