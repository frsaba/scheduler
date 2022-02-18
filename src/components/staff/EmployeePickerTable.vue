// search

<script lang="ts">
import { defineComponent, ref, watch } from '@vue/composition-api'
import { createNamespacedHelpers } from 'vuex-composition-helpers'
import { Employee, Staff } from "@/model/staff"
import store from "@/state/store"
import { tagColors, tagFontColors } from "@/plugins/vuetify"

export default defineComponent({
	name: "EmployeePickerTable",
	setup(props, context) {
		const { useState, useMutations, useActions } = createNamespacedHelpers<Staff>(store, "staff");
		let { employees, tags } = useState(["employees", "tags"]);

		const search = ref("")
		const headers = [{ text: 'Dolgozó neve', value: 'name', width: "14em" }, { text: "Címkék", value: "tags" }]

		

		return {
			employees, headers, search, tagColors, tagFontColors, tags
		}
	},
})
</script>


<template>
	<div class="wrapper">
		<div class="title d-flex align-baseline mx-2">
			<span class="text-overline employees-title">
				Beosztásban szereplő dolgozók
			</span>
			<v-spacer></v-spacer>
			<v-text-field
				v-model="search"
				prepend-icon="mdi-magnify"
				label="Keresés"
				single-line
				hide-details
				clearable></v-text-field>
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
			class="table">
			<template v-slot:no-results>Nincs ilyen nevű dolgozó!</template>
			<template v-slot:[`item.tags`]="{ item }">
				<div class="tags">
					<v-chip
						v-for="(element, i) in item.tags"
						:key="i"
						:color="tags.find(x => x.name == element).color"
						:text-color="tags.find(x => x.name == element).fontColor"
						dark
						label
						small>
						{{ element }}
					</v-chip>
				</div>
			</template>
		</v-data-table>
	</div>
</template>

<style scoped>
.table {
	width: 100%;
}
.tags {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	padding: 8px;
}
.employees-title {
	padding: 20px;
}
</style>