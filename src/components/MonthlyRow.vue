<script lang="ts">
import Vue from "vue";
import ScheduleDayComponent from "@/components/ScheduleDay.vue";
import { accumulators, Aggregate } from "@/model/aggregates"
import { ScheduleDay } from "@/model/schedule-sheet";
export default Vue.extend({
	name: "Monthlyrow",
	components: {
		ScheduleDayComponent,
	},
	props: {
		employee_name: String,
		days: Array,
		selection: []
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
		accumulators(): Aggregate[] {
			return accumulators
		},
		//Having this as computed means it only updates when this.days changes
		accumulator_values(): (number | boolean)[] {
			return this.accumulators.map(a => a.evaluate(this.days as ScheduleDay[]));
		},
		counter_styles(): Array<any> {
			// return accumulators.map(a => ({ backgroundColor: a.header_color }))
			return accumulators.map((a, i) =>
			({
				backgroundColor: a.background_color,
				right: (accumulators.length - 1 - i) * 3 + "em" //right side sticky columns
			}))
		}
	}
});
</script>

<template>
	<tr>
		<th>{{ employee_name }}</th>
		<schedule-day-component
			v-for="(data, index) in days"
			:key="index"
			:day="index + 1"
			:type="data.type"
			:duration="data.duration"
			:start="data.start"
			:selection="selection"
			@mousedown.native.left.prevent.stop="down(index + 1)"
			@mouseup.native.left.stop="up(index + 1)"
			@mouseenter.native="enter(index + 1)" />
		<td class="sticky-right text-center counter" v-for="(acc,i) in accumulator_values" :style="counter_styles[i]" :key="accumulators[i].label" >
            <v-icon v-if="typeof acc === 'boolean'" :color="acc ? 'success' : 'warning'">
                {{acc ? 'mdi-check' : 'mdi-alert'}}
            </v-icon>
            <span v-else>{{acc}}</span>
        </td>
	</tr>
</template>

<style scoped>
th {
	filter: opacity(1);
	border-right: 4px double #ccc;
	z-index: 1;
}
.counter {
	/* filter: brightness(120%) saturate(50%); */
	border: 1px solid #ccc;
	position: sticky;
	background-color: white;
	width: 100vw
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