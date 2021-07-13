<script lang="ts">
import Vue from "vue";
import { DayType, DayTypeDescriptions } from "@/day-types";
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
			if (this.type == DayType.shift) {
				return `${this.start} - ${(this.duration + this.start) % 24}`;
			} else if (this.type == DayType.unpaid) {
				return this.is_sunday ? "P" : "SZ"
			}
			else {
				return DayTypeDescriptions[this.type].label
			}
		},
		style(): string {
			// let style = this.type_string
			let style = ""
			if (this.selected) {
				style += " selected"
			}
			if (this.is_weekend) {
				style += " weekend"
			}
			// console.log(style)
			return style

		},
		color(): string {
			let from_desc = DayTypeDescriptions[this.type].color
			// if(this.type == DayType.empty || this.type == DayType.shift){
			//     return ""
			// }
			return from_desc
			// return ""
		},
		type_string(): string {
			return Object.entries(DayType)[this.type][1] as string
		},
		is_weekend(): boolean {
			let dayOfWeek = this.to_date.getDay()
			return (dayOfWeek === 6) || (dayOfWeek === 0); // 6 = Saturday, 0 = Sunday
		},
		is_sunday(): boolean {
			let dayOfWeek = this.to_date.getDay()
			return (dayOfWeek === 0); // 6 = Saturday, 0 = Sunday
		},
		to_date(): Date {
			let sheet = this.$store.state.sheets.sheet
			return new Date(sheet.year, sheet.month, this.day)
		}

	},
});
</script>

<template>
	<td :class="style" :style="{backgroundColor: color}">
		{{ display_text }}
	</td>
</template>

<style scoped>
td:hover {
	/* background-color: #ddd; */
	filter: brightness(80%);
	cursor: pointer;
}
td {
	border: 0.5px solid #ccc;
	text-align: center;
	min-width: 3.75em;
	text-shadow: white 0px 0px 10px;
}
.selected {
	border: 0.5px solid #1f1f1f;
	background-color: #ccc;
	text-align: center;
	filter: brightness(80%);
}
.weekend {
	/* background-color: lightblue; */
	/* border: solid 1px #1f1f1f; */
	filter: brightness(90%);
	z-index: -1000;
}
</style>