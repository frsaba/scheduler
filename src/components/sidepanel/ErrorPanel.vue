<script lang="ts">
import { ErrorGroup } from '@/model/assertions'
import { defineComponent } from '@vue/composition-api'
import ErrorListItem from '@/components/sidepanel/ErrorItem.vue'

export default defineComponent({
	name: "ErrorPanel",
	components: { ErrorListItem },
	props: {
		label: String,
		icon: String,
		color: String,
		list: Array as () => Array<ErrorGroup>,
	},
	setup(props) {
	},
})
</script>


<template>
	<v-expansion-panel>
		<v-expansion-panel-header class="overline">
			<div>
				<v-icon left :color="list.length > 0 ? color : 'grey'">{{ icon }}</v-icon
				>{{ label }} ({{ list.length }})
			</div>
		</v-expansion-panel-header>
		<v-expansion-panel-content>
			<error-list-item
				v-for="group in list"
				:key="`${group.employee.name}-${group.days}-${group.description}`"
				:group="group"
			>
			</error-list-item>
		</v-expansion-panel-content>
	</v-expansion-panel>
</template>