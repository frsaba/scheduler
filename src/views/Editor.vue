<script lang="ts">
import Vue from 'vue'
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import Monthly from "@/views/Monthly.vue"
import GlobalCounters from "@/components/GlobalCounters.vue"
import { assertions, ErrorGroup } from "@/model/assertions"
import { Sheet } from '@/model/schedule-sheet'
import { CountStartingTimes } from '@/model/aggregates'

export default Vue.extend({
	name: "Editor",
	components: { Splitpanes, Pane, Monthly, GlobalCounters },
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
	<splitpanes class="default-theme">
		<pane min-size="50">
			<monthly :error_groups="error_groups" :start_times="start_times"/>
		</pane>
		<pane size="20">
			<splitpanes horizontal>
				<pane>
					<global-counters :start_times="start_times" />
				</pane>
				<pane>
					<div>Warnings and errors</div>
				</pane>
			</splitpanes>
		</pane>
	</splitpanes>
</template>