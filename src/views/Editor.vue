<script lang="ts">
import Vue from 'vue'
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import Monthly from "@/views/Monthly.vue"
import GlobalCounters from "@/components/GlobalCounters.vue"
export default Vue.extend({
	name: "Editor",
	components: { Splitpanes, Pane, Monthly, GlobalCounters },
})
</script>

<template>
	<splitpanes class="default-theme">
		<pane min-size="50">
			<monthly />
		</pane>
		<pane>
			<splitpanes horizontal>
				<pane>
					<global-counters/>
				</pane>
				<pane>
					<div>Warnings and errors</div>
				</pane>
			</splitpanes>
		</pane>

	</splitpanes>
</template>