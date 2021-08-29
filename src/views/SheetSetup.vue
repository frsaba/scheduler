<script lang="ts">
import { computed, defineComponent, ref } from '@vue/composition-api'
import { createNamespacedHelpers, useState } from 'vuex-composition-helpers'
import store from "@/state/store"
import { Employee, Staff } from "@/model/staff"
import EmployeePicker from "@/components/staff/EmployeePickerTable.vue"
import moment from "moment"
import { ipcRenderer } from "electron"
import path from "path"

export default defineComponent({
	name: "SheetSetup",
	components: {
		EmployeePicker
	},
	setup(props, context) {
		const { useState: useStaffState } = createNamespacedHelpers<Staff>(store, "staff");
		const recentSheets = useState(store, ["sheets"]).sheets.value.recentSheets
		const { employees } = useStaffState(["employees"]);
		const newSheetDialog = ref(false)
		const selection = ref(employees.value)
		const datePicker = ref(new Date().toISOString().substring(0, 9))

		// const recentSheets = [
		// 	[2021, "január", 15, moment([2021, 7, 27, 19, 34]).locale("HU").calendar(), "G:/repos/scheduler/src/assets/out.xlsx"],
		// 	[2020, "december", 12, moment([2021, 7, 26, 19, 13]).locale("HU").calendar(), "G:/repos/scheduler/src/assets/out.xlsx"],
		// ]

		const recents = computed(() => recentSheets.map(entry =>[
			path.basename(entry.path),
			entry.year, moment(entry.month  + 1, "M", "HU").format("MMMM"),
			entry.employeeCount,
			moment(entry.modified).locale("HU").calendar(),
			entry.path]))

		function importRecentSheet(path: string) {
			ipcRenderer.send("import-path", path)
		}

		return {
			newSheetDialog,
			datePicker,
			selection,
			employees,
			recents,
			importRecentSheet
		}
	},
	methods: {
		newSheet() {
			this.$router.push("/")
			const date = new Date(this.datePicker)
			this.$store.dispatch("new_sheet", { year: date.getFullYear(), month: date.getMonth(), employees: this.selection })
		}
	},
})
</script>

<template>
	<div class="d-flex align-center justify-center wrapper">
		<v-dialog v-model="newSheetDialog" width="unset" height="80%">
			<template v-slot:activator="{ on, attrs }">
				<div class="sheet template-border" v-bind="attrs" v-on="on">

					<v-icon x-large>mdi-plus</v-icon>
					<span class="overline">Új beosztás</span>
				</div>
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
					show-current="false"></v-date-picker>
				<v-divider></v-divider>
				<employee-picker v-model="selection" :defaultSelection="employees"></employee-picker>
				<v-divider></v-divider>
				<v-card-actions>
					<v-spacer></v-spacer>
					<v-btn
						color="primary"
						text
						@click="newSheet"
						:disabled="selection.length < 1">
						Létrehozás
					</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>
		<button class="sheet"
			v-for="[filename, year,month,numEmployees, timeAgo, path] in recents"
			:key="path"
			@click="importRecentSheet(path)">

			<v-icon>mdi-calendar</v-icon>
			<span class="font-weight-bold">{{year}}. {{month}}</span>
			<span class="caption">{{numEmployees}} dolgozó</span>
			<span class="caption">Módosítva: {{timeAgo}}</span>
			<span class="filename">{{filename}}</span>

		</button>
	</div>
</template>

<style scoped lang="scss">
.dialog {
	min-width: 400px;
	max-width: 600px;
}
.sheet {
	border: 3px solid #ccc;
	background: #fff;
	display: flex;
	position:relative;
	align-items: center;
	flex-direction: column;
	justify-content: center;
	width: 200px;
	height: 300px;
	border-radius: 5%;

	&:hover {
		filter: brightness(98%);
		& > .v-icon {
			transform: scale(110%);
		}
	}
	.filename{
		position:absolute;
		left: 10px;
		top: 10px;
	}
}

.wrapper {
	height: 100%;
	gap: 10px;
	flex-wrap: wrap;
}
</style>
