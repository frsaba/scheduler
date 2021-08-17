<script lang="ts">
import { defineComponent, ref, Ref, watch } from '@vue/composition-api'
import EmployeeTable from "@/components/EmployeePickerTable.vue"
import { Sheet } from '@/model/schedule-sheet';
import { useActions, useState, useGetters, createNamespacedHelpers } from "vuex-composition-helpers";
import { Employee, Staff } from '@/model/staff';
import store from "@/state/store"

export default defineComponent({
	name: "EmployeePicker",
	props: {
		value: Boolean
	},
	components: {
		EmployeeTable
	},
	setup(props, context) {
		const sheet: Sheet = useState(["sheets"]).sheets.value.sheet;
		const selection = ref([] as Employee[])
		const { useState: useStaffState } = createNamespacedHelpers<Staff>(store, "staff");
		const { employees } = useStaffState(["employees"]);

		watch(() => props.value, () => { selection.value = sheet.schedule.map(row => row.employee) })

		function confirm() {
			const { add, remove_employee } = useActions(store, ["add", "remove_employee"])
			const isInSheet: (name: string) => boolean = useGetters(store, ["isInSheet"]).isInSheet.value
			for (let employee of employees.value) {
				if (!isInSheet(employee.name) && selection.value.includes(employee)) add(employee)
                if (isInSheet(employee.name) && !selection.value.includes(employee)) remove_employee(employee.name)
			}
			close();

		}
		function close() {
			context.emit('input', false)
		}

		return { selection, confirm, close }
	},
})
</script>

<template>
	<v-dialog v-on="$listeners" :value="value" width="600">
		<v-card>
			<employee-table v-model="selection"></employee-table>
			<v-card-actions>
				<v-spacer></v-spacer>
				<v-btn
					color="primary"
					text
					@click="confirm()"
					:disabled="selection.length < 1"
				>
					Alkalmaz
				</v-btn>
				<v-btn color="primary" text @click="close"> Mégse </v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>