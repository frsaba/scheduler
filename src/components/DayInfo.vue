<script lang="ts">
import { computed, defineComponent, Ref } from '@vue/composition-api'
import { useState } from "vuex-composition-helpers"
import BasePopover from "@/components/BasePopover.vue";
import { Sheet } from '@/model/schedule-sheet';
import { getHoliday } from "@/utils/date-helpers";
import { CountStartingTimes } from "@/model/aggregates"

export default defineComponent({
	components: {
		BasePopover
	},
	props: {
		value: Boolean,
		targets: {
			type: Array as () => Array<Element>,
			default: () => []
		},
	},
	setup(props) {
		const day = computed(() => Number(props.targets[0]?.innerHTML))
		const sheet: Sheet = useState(['sheets']).sheets.value.sheet

		const dateFormat: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
		const date = computed(() => new Date(sheet.year, sheet.month - 1, day.value))

		const localeString = computed(() => date.value.toLocaleDateString('hu-HU', dateFormat))

		const holiday = computed(() => getHoliday(date.value)?.name)

		const startTimesCache = computed(() => CountStartingTimes(sheet))
		const startTimes = computed(() =>
			Array.from(startTimesCache.value, ([hour, counts]) => [hour, counts[day.value - 1]]))

		return {
			day,
			date,
			localeString,
			holiday,
			startTimes
		}
	},
})
</script>

<template>
	<base-popover v-model="value" v-bind:targets="targets">
		<v-card class="card">
			<div class="text-overline">{{ localeString }}</div>
			<div class="holidayName text-caption mb-3 text-center">{{ holiday }}</div>
			<table>
				<tr class="text-caption"  v-for="[hour, count] in startTimes" :key="hour">
					<td>{{ hour }} órakor kezd:</td>
					<td class="text-center">
						{{ count }}
					</td>
				</tr>
			</table>
		</v-card>
	</base-popover>
</template>

<style scoped>
.card {
	padding: 1em;
	display: flex;
	flex-direction: column;
}
</style>