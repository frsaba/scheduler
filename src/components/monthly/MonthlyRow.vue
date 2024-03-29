<script lang="ts">
import Vue from "vue";
import ScheduleDayComponent from "@/components/monthly/ScheduleDay.vue";
import { Aggregate } from "@/model/aggregates"
import { ScheduleDay, ScheduleRow } from "@/model/schedule-sheet";
import { assertions, ErrorGroup } from "@/model/assertions"
export default Vue.extend({
	name: "Monthlyrow",
	components: {
		ScheduleDayComponent,
	},
	props: {
		row: ScheduleRow,
		selection: [],
		error_groups: Array as () => ErrorGroup[],
		aggregates: Array as () => Aggregate[]
	},
	methods: {
		down(i: number) {
			this.$emit("day-mouse-down", i);
		},
		up(i: number) {
			this.$emit("day-mouse-up", i);
		},
		enter(i: number) {
			this.$emit("day-mouse-enter", i);
		},
	},
	computed: {
		// aggregates(): Aggregate[] {
		// 	return aggregates
		// },
		days() {
			return this.row.days
		},
		employee_name() {
			return this.row.employee.name
		},
		//Having this as computed means it only updates when this.days changes
		accumulator_values(): (number | boolean)[] {
			return this.aggregates.map(a => a.evaluate(this.days as ScheduleDay[]));
		},
		counter_styles(): Array<any> {
			// return aggregates.map(a => ({ backgroundColor: a.header_color }))
			return this.aggregates.map((a, i) =>
			({
				backgroundColor: a.background_color,
				right: (this.aggregates.length - 1 - i) * 3 + "em" //right side sticky columns
			}))
		}
	}
});
</script>

<template>
	<tr>
		<th @contextmenu="$emit('employee-contextmenu', $event)">
			{{ employee_name }}
		</th>
		<schedule-day-component
			v-for="(data, index) in days"
			:key="index"
			:day="index + 1"
			:error_groups="error_groups.filter(x => x.days.includes(index))"
			:type="data.type"
			:duration="data.duration"
			:start="data.start"
			:selection="selection"
			@mousedown.native.left.prevent.stop="down(index + 1)"
			@mouseup.native.left.stop="up(index + 1)"
			@mouseenter.native="enter(index + 1)"
		/>
		<td
			class="sticky-right text-center counter"
			v-for="(acc, i) in accumulator_values"
			:style="counter_styles[i]"
			:key="aggregates[i].label"
		>
			<v-icon
				v-if="typeof acc === 'boolean'"
				:color="acc ? 'success' : 'warning'"
			>
				{{ acc ? "mdi-check" : "mdi-alert" }}
			</v-icon>
			<span v-else>{{ acc }}</span>
		</td>
	</tr>
</template>

<style scoped>
th {
	filter: opacity(1);
	border-right: 4px double #ccc;
	z-index: 1;
	outline: none;
}
.counter {
	/* filter: brightness(120%) saturate(50%); */
	border: 1px solid #ccc;
	position: sticky;
	background-color: white;
	width: 100vw;
}
.counter::before {
	/* content: "asd"; */
	position: absolute;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
	background: white;
	filter: opacity(90%);
}
.sticky-right {
	position: sticky;
	/* right: 0; */
	z-index: 1;
}
</style>