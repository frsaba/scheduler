<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api'
import { ErrorGroup } from '@/model/assertions'
import ErrorPanel from '@/components/ErrorPanel.vue'

export default defineComponent({
	props: {
		error_groups: Array as () => Array<Array<ErrorGroup>>,
	},
	components: { ErrorPanel },
	setup(props) {
		const flat = computed(() => props.error_groups!.flat())
		const errors = computed(() => flat.value.filter(e => e?.fatal));
		const warnings = computed(() => flat.value.filter(e => !e?.fatal));
		return { errors, warnings }
	},
})
</script>

<template>
	<v-expansion-panels multiple accordion dense class="wrapper">
		<error-panel
			v-for="([label, list, icon, color], i) in [
				['Figyelmeztetések', warnings, 'mdi-alert', 'warning'],
				['Hibák', errors, 'mdi-alert-octagon', 'error'],
			]"
			:key="i"
			v-bind="{label,list,icon, color}"
		></error-panel>
	</v-expansion-panels>
</template>

<style scoped>
.wrapper {
	max-height: 100%;
	overflow-y: auto;
}
</style>