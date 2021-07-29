<script lang="ts">
import Vue from 'vue'
import { CountStartingTimes, StartTimeCount } from "@/model/aggregates"
import { Sheet } from '@/model/schedule-sheet'
export default Vue.extend({
	name: "GlobalCounters",
	computed: {
		start_times(): any[] {
			return CountStartingTimes(this.sheet)
		},
		sheet(): Sheet {
			return this.$store.state.sheets.sheet
		}
	},
})
</script>

<template>
	<div class="table-wrapper">
		<table>
			<thead>
				<th />
				<th v-for="day in sheet.month_length" :key="day">{{day}}</th>
			</thead>
			<tbody>
				<tr v-for="row in start_times" :key="row.hour">
					<th>{{row.hour}} órakor kezd</th>
					<td v-for="day in sheet.month_length" :key="day">{{row.counts[day-1]}}</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>

<style scoped>
td {
	width: 100vw;
	text-align: center;
	height: 2.5em;
}
th {
	min-width: 1.5em;
	height: 2.5em;
}
thead th:first-child {
	min-width: 10em;
}
</style>