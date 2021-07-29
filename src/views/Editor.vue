<script lang="ts">
import Vue from 'vue'
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import Monthly from "@/views/Monthly.vue"
export default Vue.extend({
	name: "Editor",
	components: { Splitpanes, Pane, Monthly },
})
</script>

<template>
	<splitpanes class="default-theme">
		<pane min-size="50">
			<monthly />
		</pane>
		<pane>

			<splitpanes class="default-theme" horizontal>
				<pane>
					<div>Warnings and errors</div>
				</pane>
				<pane>
					<div>Global aggregates</div>
				</pane>
			</splitpanes>
		</pane>

	</splitpanes>
</template>