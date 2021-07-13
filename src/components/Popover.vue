<script lang="ts">
import Vue from "vue";
import { DayType } from "@/schedule-sheet";
export default Vue.extend({
	name: "Popover",
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
		};
	},
	computed: {
		x() {
			return (this.selected_start.x + (this.selected_end.x + this.selected_end.width - this.selected_start.x - 400) / 2);
		},
		y(): number {
			return this.selected_start.y + this.selected_start.height + 5;
		},
	},
	created() {
		window.addEventListener("keyup", this.escToClose);
	},
	destroyed() {
		window.removeEventListener("keyup", this.escToClose);
	},
	methods: {
		close() {
			this.$emit("close");
		},
		escToClose(e: KeyboardEvent) {
			if (e.key == "Escape") {
				this.close();
			}
		},
		//if user changes the start, keep duration the same and set shift_end accordingly
		inputStart() {
			this.shift_start = Math.abs(this.shift_start + 24) % 24;
			this.shift_end = (this.shift_duration + this.shift_start) % 24;
			this.setShift();
		},
		//if user changes end, decrease duration and keep shift_start the same
		inputEnd() {
			this.shift_end = Math.abs(this.shift_end + 24) % 24;
			this.shift_duration = (this.shift_start < this.shift_end ? 0 : 24) + this.shift_end - this.shift_start;
			this.setShift()
		},
		setShift() {
			this.$emit('set-shift', { start: this.shift_start, duration: this.shift_duration })
		},
		setType(type: string) {
			let t = DayType[type as keyof typeof DayType]
			this.$emit('set-type', t)
		}
	},
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
		absolute
	>
		<v-card class="card">
			<v-text-field
				solo
				label="label"
				type="number"
				v-model.number="shift_start"
				@input="inputStart"
			></v-text-field>
			<span>-</span>
			<v-text-field
				solo
				label="label"
				type="number"
				v-model.number="shift_end"
				@input="inputEnd"
			></v-text-field>
			<v-btn class="fab" fab @click="setShift()"><v-icon>mdi-set-split</v-icon></v-btn>
			<v-btn class="fab" fab @click="setType('empty')"><v-icon>mdi-delete</v-icon></v-btn>
			<v-btn class="fab" fab @click="close" x-small elevation="0"
				><v-icon>mdi-close</v-icon></v-btn
			>
		</v-card>
	</v-menu>
</template>

<style scoped>
.card {
	padding: 0.5em;
	display: flex;
	width: 400px;
	align-items: baseline;
	gap: 10px;
}
.fab:focus::before {
  opacity: 0 !important;
}
.fab:hover::before {
  opacity: 0.08 !important;
}
</style>