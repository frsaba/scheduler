<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api'
import { ErrorGroup } from '@/model/assertions'
import ErrorListItem from '@/components/ErrorListItem.vue'

export default defineComponent({
	props: {
		error_groups: Array as () => Array<Array<ErrorGroup>>,
	},
	components: { ErrorListItem },
	setup(props) {
		const errors = computed(() => props.error_groups?.flat())
		return {errors}
	},
})
</script>

<template>
<div class="wrapper">
	<error-list-item v-for="group in errors" :key="`${group.employee.name}-${group.days}-${group.description}`" :group="group"> </error-list-item>
</div>
</template>

<style scoped>
.wrapper{
	height: 100%;
	overflow-y: scroll;
}
</style>