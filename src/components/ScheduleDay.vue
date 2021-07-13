<script lang="ts">
import Vue from "vue";
import { DayType, DayTypeDescriptions } from "@/schedule-sheet";
import { type } from "process";
export default Vue.extend({
	name: "Day",
	props: {
		day: Number,
		test: Object,
		type: Number,
		start: Number,
		duration: Number,
		selected: {
			default: true
		}
	},
	computed: {
		display_text(): string {
			return DayTypeDescriptions[this.type].label
		},
		style(): string {
			let style = Object.entries(DayType)[this.type][1] as string
			if (this.selected) {
				return style + " selected"
			} else {
				return style
			}
		}
	},
});
</script>

<template>
	<td :class="style">
		{{ display_text }}
	</td>
</template>

<style scoped>
td:hover {
	background-color: #ddd;
	cursor: pointer;
}
td {
	border: 0.5px solid #ccc;
	text-align: center;
	min-width: 4em;
}
.selected {
	border: 0.5px solid #1f1f1f;
	background-color: #ccc;
	text-align: center;
	min-width: 4em;
}
.sick {
	background-color: hotpink;
}
</style>