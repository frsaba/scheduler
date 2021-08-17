<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api'
import { createNamespacedHelpers } from 'vuex-composition-helpers'
import store from "@/state/store"
import { Employee, Staff } from "@/model/staff"
import EmployeePicker from "@/components/EmployeePicker.vue"

export default defineComponent({
	name: "SheetSetup",
	components: {
		EmployeePicker
	},
	setup(props, context) {
		const { useState, useMutations, useActions } = createNamespacedHelpers<Staff>(store, "staff");
		const { employees } = useState(["employees"]);
		const newSheetDialog = ref(false)
		const selection = ref(employees.value)
		const datePicker = ref(new Date().toISOString().substring(0, 9))

		return {
			newSheetDialog,
			datePicker,
			selection,
			employees
		}
	},
	methods: {
		newSheet() {
			this.$router.push("/")
			const date = new Date(this.datePicker)
			this.$store.dispatch("new_sheet", { year: date.getFullYear(), month: date.getMonth() + 1, employees: this.selection })
		}
	},
})
</script>

<template>
	<v-dialog v-model="newSheetDialog" width="unset" height="80%">
		<template v-slot:activator="{ on, attrs }">
			<v-btn dark v-bind="attrs" v-on="on"> Új beosztás </v-btn>
		</template>

		<v-card class="dialog">
			<v-card-title class="text-h5 grey lighten-2">
				Új beosztás
			</v-card-title>
			<v-date-picker
				v-model="datePicker"
				full-width
				type="month"
				min="2020-01"
				locale="hu-hu"
				show-current="false"
			></v-date-picker>
			<v-divider></v-divider>
			<employee-picker v-model="selection" :defaultSelection="employees">
				<span class="text-overline employees-title">
					Beosztásban szereplő dolgozók
				</span>
			</employee-picker>
			<v-divider></v-divider>
			<v-card-actions>
				<v-spacer></v-spacer>
				<v-btn
					color="primary"
					text
					@click="newSheet"
					:disabled="selection.length < 1"
				>
					Létrehozás
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<style scoped>
.employees-title {
	padding: 20px;
}
.dialog {
	min-width: 400px;
	max-width: 600px;
}
</style>>
