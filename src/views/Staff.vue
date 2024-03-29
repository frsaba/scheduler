<script lang="ts">
import { defineComponent, ref, watch } from '@vue/composition-api'
import { createNamespacedHelpers, useNamespacedState, useState } from "vuex-composition-helpers";
import store from "@/state/store"
import EmployeeRow from "@/components/staff/EmployeeRow.vue"
import { Employee, Staff } from '@/model/staff';

export default defineComponent({
	name: "StaffMenu",
	components: {
		EmployeeRow,
	},
	setup(props, context) {
		// useNamespacedState("staff",)
		const { useState, useMutations, useActions } = createNamespacedHelpers(store, "staff");
		const { employees } = useState(["employees"]);
		const { add, remove } = useActions(["add", "remove"]);
		const dialog = ref(false);

		const valid = ref(false);
		const newEmployeeName = ref("");
		const employeeNameRules = [
			() => newEmployeeName.value != "" || 'Név nem lehet üres',
			() => employees.value.every((e: Employee) => e.name != newEmployeeName.value) || 'Már létezik ilyen nevű dolgozó!'
		];

		//@ts-ignore
		watch(dialog, () => context.root.$nextTick(() => context.refs.form.resetValidation()))

		function create(name: string) {
			if (!valid.value) return;
			add({name})
			newEmployeeName.value = ""
			dialog.value = false
			context.root.$nextTick(() => window.scrollTo({behavior: "smooth", top: document.body.scrollHeight}));
		}
		return { employees, create, remove, dialog, newEmployeeName, employeeNameRules, valid }
	},
})
</script>


<template>
	<div>
		<v-btn class="ma-2" color="success" @click="$router.go(-1)"> Vissza</v-btn>
		<v-dialog v-model="dialog" width="500px">
			<template v-slot:activator="{ on, attrs }">
				<v-btn class="ma-2" color="success" v-bind="attrs" v-on="on">
					<v-icon left>mdi-account-plus</v-icon> Új dolgozó
				</v-btn>
			</template>

			<v-card>
				<v-card-title class="text-h5 grey lighten-2">
					Új dolgozó felvétele
				</v-card-title>
				<v-card-text>
					<v-form v-model="valid" ref="form">
						<v-text-field
							label="Dolgozó neve"
							autofocus
							v-model.trim="newEmployeeName"
							:rules="employeeNameRules"
							@keydown.enter.prevent="create(newEmployeeName)"></v-text-field>
					</v-form>
				</v-card-text>

				<v-divider></v-divider>

				<v-card-actions>
					<v-spacer></v-spacer>
					<v-btn
						:disabled="!valid"
						color="primary"
						text
						@click="create(newEmployeeName)">
						Hozzáadás
					</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>
		<div class="text-center">
			<employee-row
				v-for="employee in employees"
				:key="employee.name"
				:id="employee.id"
				:name="employee.name"
				@remove="remove"></employee-row>
			<div class="text-center" v-if="employees.length == 0">
				Nincsenek dolgozók definiálva. <br />
				<a @click="dialog = true">
					<v-icon color="primary" left>mdi-account-plus</v-icon>
					<span class="overline">Új dolgozó</span>
				</a>
			</div>
		</div>
	</div>
</template>
