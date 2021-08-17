<script lang="ts">
import Vue from 'vue'
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import Monthly from "@/views/Monthly.vue"
import GlobalCounters from "@/components/GlobalCounters.vue"
import { assertions, ErrorGroup } from "@/model/assertions"
import { Sheet } from '@/model/schedule-sheet'
import { CountStartingTimes } from '@/model/aggregates'
import ErrorList from "@/components/ErrorList.vue";

export default Vue.extend({
	name: "Editor",
	components: { Splitpanes, Pane, Monthly, GlobalCounters, ErrorList },
	computed: {
		error_groups(): ErrorGroup[][] {
			return this.sheet.schedule.map(row => assertions.map(x => x.evaluate(row)).flat())
		},
		start_times(): [number, number[]][] {
			return Array.from(CountStartingTimes(this.sheet).entries())
		},
		sheet(): Sheet {
			return this.$store.state.sheets.sheet
		}
	}
})
</script>

<template>
	<splitpanes class="default-theme panes">
		<pane min-size="50">
			<monthly :error_groups="error_groups" :start_times="start_times" />
		</pane>
		<pane size="20">
			<splitpanes horizontal>
				<pane>
					<global-counters :start_times="start_times" v-if="start_times.length > 0"/>
					<div v-else class="placeholder text-center mt-2 overline">
						<v-icon>mdi-calendar-clock</v-icon> 
						Napra lebontás itt fog megjelenni
					</div>
				</pane>
				<pane>
					<error-list :error_groups="error_groups"></error-list>
				</pane>
			</splitpanes>
		</pane>
	</splitpanes>
</template>

<style scoped>
.panes {
	height: calc(100vh - 64px);
}
.placeholder{
	overflow: hidden;
}
</style>

<style>
.table {
	position: relative;
	border-collapse: separate;
	table-layout: fixed;
	user-select: none;
	border-spacing: 0;
}
.table thead th {
	position: sticky;
	top: 0;
	background: #000;
	color: #fff;
	z-index: 1;
}
.table head th:hover {
	filter: invert(15%);
}

.table thead th:first-child {
	left: 0;
	z-index: 2;
}

.table tbody th {
	position: sticky;
	left: 0;
	background: #fff;
	border: 1px solid #ccc;
}
a:hover span {
	text-decoration: underline;
}
</style>