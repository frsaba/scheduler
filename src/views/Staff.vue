<script lang="ts">
import { defineComponent ,ref} from '@vue/composition-api'
import { createNamespacedHelpers, useNamespacedState, useState } from "vuex-composition-helpers";
import store from "@/state/store"
import EmployeeRow from "@/components/EmployeeRow.vue"

export default defineComponent({
	components: {
		EmployeeRow,
	},
	setup() {
		// useNamespacedState("staff",)
		const { useState, useMutations, useActions } = createNamespacedHelpers(store, "staff");
		const { employees } = useState(["employees"]);
		const {add, remove} = useActions(["add", "remove"]);
		const dialog = ref(false);
		const new_employee_name = ref("");

		function rename(oldName: string, newName: string) {
			useMutations(["rename"]).rename({ oldName, newName })
		}

		function create(name: string) {
			add(name)
			dialog.value = false
		}

		return { employees, rename, create, remove, dialog, new_employee_name }
	},
})
</script>


<template>
	<div>
		<v-btn color="success" @click="$router.go(-1)"> Vissza</v-btn>
		
		<v-dialog v-model="dialog" width="500">
			<template v-slot:activator="{ on, attrs }">
				<v-btn color="success" v-bind="attrs" v-on="on"> Új dolgozó</v-btn>
			</template>

			<v-card>
				<v-card-title class="text-h5 grey lighten-2">
					Új dolgozó felvétele
				</v-card-title>

				<v-card-text>
					<v-text-field solo label="Dolgozó neve" v-model="new_employee_name"></v-text-field>
				</v-card-text>

				<v-divider></v-divider>

				<v-card-actions>
					<v-spacer></v-spacer>
					<v-btn color="primary" text @click="create(new_employee_name)">
						Hozzáadás
					</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<employee-row
			v-for="(employee, index) in employees"
			:key="index"
			:name="employee.name"
			@rename="rename(employee.name, $event)"
			@remove="remove"
		></employee-row>
	</div>
</template>