<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api'
import { useState, useActions } from "vuex-composition-helpers"
import BasePopover from "@/components/BasePopover.vue";
import { Sheet } from '@/model/schedule-sheet';
import { Employee } from '@/model/staff';

export interface EmployeeInfoOptions {
	show: boolean,
	target: Employee | null,
	event: MouseEvent | null
}

export default defineComponent({
	components: {
		BasePopover
	},
	props: {
		options: {
			type: Object as () => EmployeeInfoOptions,
			required: true
		},

	},
	setup(props) {
		const sheet: Sheet = useState(['sheets']).sheets.value.sheet;
		const employee = computed(() => props.options.target);
		const x = computed(() => props.options.event?.clientX);
		const y = computed(() => props.options.event?.clientY);

		const remove = useActions(['remove_employee']).remove_employee

		return {
			employee,
			x, y,
			remove
		}
	},
})
</script>

<template>
	<v-menu
		v-model="options.show"
		:position-x="x"
		:position-y="y"
		absolute
		offset-y
		class="menu"
	>
		<v-list>
			<v-list-item link @click="$router.push('/staff')">
				Szerkesztés
			</v-list-item>
			<v-list-item link @click="remove(employee.name)">
				Eltávolítás ebből a beosztásból
			</v-list-item>
		</v-list>
	</v-menu>
</template>

<style scoped>
.menu {
	z-index: 10;
}
</style>