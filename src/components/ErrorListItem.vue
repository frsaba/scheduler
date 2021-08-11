<script lang="ts">
import { computed, defineComponent, reactive, toRefs } from '@vue/composition-api'
import { ErrorGroup } from '@/model/assertions'
import _ from 'lodash'

export default defineComponent({
	props: {
		group: ErrorGroup,
	},
	setup(props) {
		const displayDays = computed(() => {
			const days = props.group?.days
			if (days?.length == 1) return days[0]
			return `${_.first(days)!+1}-${_.last(days)!+1}`

		})
		return {
			...toRefs(reactive(props.group!)),
			displayDays

		}
	},
})
</script>

<template>
	<v-card class="card">
		<v-icon :color="fatal ? 'error' : 'warning'" class="icon">
			{{ fatal ? "mdi-alert-octagon" : "mdi-alert" }}
		</v-icon>
		<div class="description">
			{{ description }}
		</div>
		<div class="origin text-caption">
			{{ employee.name }}, {{ displayDays }}. nap
		</div>
	</v-card>
</template>

<style scoped>
.card {
	display: flex;
	padding: 0.25em;
	margin: 0.25em;
	flex-wrap: wrap;
    justify-content: flex-end;
}
.icon {
	padding: 10px;
	flex-grow: 0;
	text-align: center;
}
.description {
	padding: 10px;
	text-align: justify;
	flex-grow: 1;
}
.origin {
	grid-column: 2;
	grid-row: 2;
	text-align: right;
    align-self: flex-end;
    /* flex-basis: 100%; */
}
</style>