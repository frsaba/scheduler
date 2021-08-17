// search

<script lang="ts">
import { defineComponent, ref, watch } from '@vue/composition-api'
import { createNamespacedHelpers } from 'vuex-composition-helpers'
import { Employee, Staff } from "@/model/staff"
import store from "@/state/store"

export default defineComponent({
	name: "EmployeePicker",
	setup(props, context) {
		const { useState, useMutations, useActions } = createNamespacedHelpers<Staff>(store, "staff");
		const { employees } = useState(["employees"]);
		const search = ref("")
		const headers = [{ text: 'Dolgozó neve', value: 'name' }]

		return {
			employees, headers, search
		}
	},
})
</script>


<template>
	<div class="wrapper">
		<div class="title d-flex mx-2">
			<slot></slot>
			<v-spacer></v-spacer>
			<v-text-field
				v-model="search"
				prepend-icon="mdi-magnify"
				label="Keresés"
				single-line
				hide-details
                clearable
			></v-text-field>
		</div>

		<v-data-table
			:headers="headers"
			:items="employees"
			v-bind="$attrs"
			@input="$emit('input', $event)"
			show-select
			hide-default-footer
			item-key="name"
			disable-pagination
			fixed-header
			height="300px"
			:search="search"
		>
			<template v-slot:no-results>Nincs ilyen nevű dolgozó!</template>
		</v-data-table>
	</div>
</template>
