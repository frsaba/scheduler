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
	computed: {
		x() {
			return (
				this.selected_start.x +
				(this.selected_end.x +
					this.selected_end.width -
					this.selected_start.x -
					150) /
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
		<v-card width="150px">
			<v-icon>edit</v-icon>
			<v-btn color="error" @click="close">Close</v-btn>
		</v-card>
	</v-menu>
</template>