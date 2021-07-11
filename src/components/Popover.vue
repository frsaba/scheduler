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
			shift_duration: 8,
		};
	},
	computed: {
		x() {
			return (
				this.selected_start.x +
				(this.selected_end.x +
					this.selected_end.width -
					this.selected_start.x -
					250 ) /
					2
			);
		},
		y(): number {
			return this.selected_start.y + this.selected_start.height + 5;
		},
		shift_end(): number {
			return this.shift_start + this.shift_duration;
		},
	},
	methods: {
		close(e: Event) {
			this.$emit("close");
		},
		validate() {
			this.shift_start = Math.abs(this.shift_start + 24) % 24;
		},
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
		<v-card class="card" ref="valami">
			<v-text-field
				solo
				label="label"
				type="number"
				v-model.number="shift_start"
				@input="validate"
			></v-text-field>
			<v-btn fab><v-icon>mdi-square-edit-outline</v-icon></v-btn>
			<v-btn color="error" @click="close">Close</v-btn>
		</v-card>
	</v-menu>
</template>

<style scoped>
.card {
	padding: 0.25em;
	display: flex;
	width: 250px;
}
</style>