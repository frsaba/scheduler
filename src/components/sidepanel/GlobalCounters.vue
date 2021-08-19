<script lang="ts">
import Vue from 'vue'
import { Sheet } from '@/model/schedule-sheet'
export default Vue.extend({
	name: "GlobalCounters",
	props: {
		start_times: Array as () => [number, number[]][]
	},
	computed: {
		sheet(): Sheet {
			return this.$store.state.sheets.sheet
		}
	},
})
</script>

<template>
	<div class="table-wrapper">
		<table class="table">
			<thead>
				<th />
				<th v-for="day in sheet.month_length" :key="day">{{ day }}</th>
			</thead>
			<tbody>
				<tr v-for="[k, v] in start_times" :key="k">
					<th>{{ k }} órakor kezd</th>
					<td v-for="day in sheet.month_length" :key="day">
						{{ v[day - 1] }}
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>

<style scoped>
td {
	text-align: center;
	height: 2.5em;
}
th {
	width: 100vw;
	min-width: 1.5em;
	height: 2.5em;
}
thead th:first-child {
	min-width: 10em;
}
.table-wrapper{
	overflow: auto !important;
	max-height: 100%;
}
</style>