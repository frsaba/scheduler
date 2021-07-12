<script lang="ts">
import Vue from "vue";
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
			shift_end : 16,
			shift_duration: 8
		};
	},
	computed: {
		x() {
			return (
				this.selected_start.x +
				(this.selected_end.x +
					this.selected_end.width -
					this.selected_start.x -
					300 ) /
					2
			);
		},
		y(): number {
			return this.selected_start.y + this.selected_start.height + 5;
		},
	},
	methods: {
		close(e: Event) {
			this.$emit("close");
		},
		//if user changes the start, keep duration the same and set shift_end accordingly
		inputStart() {
			this.shift_start = Math.abs(this.shift_start + 24) % 24;
			this.shift_end = (this.shift_duration + this.shift_start) % 24
		},
		//if user changes end, decrease duration and keep shift_start the same
		inputEnd(){
			this.shift_end = Math.abs(this.shift_end + 24) % 24;
			this.shift_duration = (this.shift_start < this.shift_end ? 0 : 24 )+ this.shift_end - this.shift_start
		}
	},
});
</script>

<template>
	<v-menu
		v-model="value"
		:close-on-content-click="false"
		:close-on-click="false"
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
			<v-btn fab><v-icon>mdi-square-edit-outline</v-icon></v-btn>
			<v-btn fab @click="close" x-small elevation="0"><v-icon>mdi-close</v-icon></v-btn>
		</v-card>
	</v-menu>
</template>

<style scoped>
.card {
	padding: 0.5em;
	display: flex;
	width: 300px;
	align-items: baseline;
	gap: 10px;
}
</style>