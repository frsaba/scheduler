<script lang="ts">
import Vue from "vue";
import ScheduleDay from "@/components/ScheduleDay.vue";
export default Vue.extend({
	name: "Monthlyrow",
	components: {
		ScheduleDay,
	},
	props: {
		employee_name: String,
		days: Array,
		selection : []
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
});
</script>

<template>
	<tr>
		<th>{{ employee_name }}</th>
		<schedule-day
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
	</tr>
</template>

<style scoped>
th {
	filter: opacity(1);
	z-index: 1;
}
</style>