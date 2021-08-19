<script lang="ts">
import { computed, defineComponent, ref } from '@vue/composition-api'
import { createNamespacedHelpers, useState, useActions } from "vuex-composition-helpers";
import store from "@/state/store"
import { Sheet } from '@/model/schedule-sheet';

export default defineComponent({
	props: {
		name: String
	},
	setup(props, context) {
		const text = ref(props.name)
		const { useMutations: useStaffMutations } = createNamespacedHelpers(store, "staff");
		const sheet: Sheet = useState(["sheets"]).sheets.value.sheet;
		function removeFromSheet() {
			useActions(store, ["remove_employee"]).remove_employee(props.name)
		}
		function addToSheet() {
			useActions(store, ["add"]).add(props.name)
		}
		function rename(oldName: string, newName: string) {
			useStaffMutations(["rename"]).rename({ oldName, newName })
		}
		const isInSheet = computed(() => sheet.schedule.some(row => row.employee.name == props.name))


		return { text, addToSheet, removeFromSheet, rename, isInSheet }
	}
})
</script>

<template>
	<v-card class="container" width="80%">
		<v-text-field
			solo
			label="Dolgozó neve"
			:value="name"
			v-model="text"
		></v-text-field>
		<v-btn color="success" @click="$emit('rename', text)">Átnevez</v-btn>
		<v-btn
			color="warning"
			v-if="isInSheet"
			@click="removeFromSheet"
		>
			<v-icon left>mdi-table-remove</v-icon> Eltávolítás a jelenlegi
			beosztásból</v-btn
		>
		<v-btn color="primary" v-else @click="addToSheet" outlined
			><v-icon left>mdi-table-plus</v-icon>Hozzáadás a jelenlegi beosztáshoz</v-btn
		>
		<v-btn color="error" @click="$emit('remove', text)"> <v-icon left>mdi-account-remove</v-icon>Törlés</v-btn>
	</v-card>
</template>

<style scoped>
.container {
	display: flex;
	margin: 10px auto;
}
</style>