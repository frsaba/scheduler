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
			return `${_.first(days)! + 1}-${_.last(days)! + 1}`

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
		<div class="upper">
			<v-icon :color="fatal ? 'error' : 'warning'" class="icon">
				{{ fatal ? "mdi-alert-octagon" : "mdi-alert" }}
			</v-icon>
			<div class="description">
				{{ description }}
			</div>
		</div>
		<div class="origin text-caption">
			{{ employee.name }}, {{ displayDays }}. nap
		</div>
	</v-card>
</template>

<style scoped>
.card {
	margin: 0.25em;
	min-width: 10em;
}
.upper {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
}
.upper > * {
	margin: 10px;
}
.icon {
	flex-grow: 0;
	text-align: center;
}
.description {
	flex: 1 1;
	margin-left: 0;
	font-size: 14px;
}
.origin {
	margin-right: 5px;
	text-align: right;
}
</style>