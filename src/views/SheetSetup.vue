<script lang="ts">
import { computed, defineComponent, ref } from '@vue/composition-api'
import { createNamespacedHelpers, useState } from 'vuex-composition-helpers'
import store from "@/state/store"
import { Employee, Staff } from "@/model/staff"
import EmployeeTable from "@/components/staff/EmployeePickerTable.vue"
import moment from "moment"
import { ipcRenderer } from "electron"
import path from "path"

export default defineComponent({
	name: "SheetSetup",
	components: {
		EmployeeTable
	},
	setup(props, context) {
		const { useState: useStaffState } = createNamespacedHelpers<Staff>(store, "staff");
		const recentSheets = useState(store, ["sheets"]).sheets.value.recentSheets
		const { employees } = useStaffState(["employees"]);
		const newSheetDialog = ref(false)
		const loading = ref(false)
		const selection = ref(employees.value)
		const datePicker = ref(new Date().toISOString().substring(0, 10))

		const recents = computed(() => recentSheets.map(entry => [
			path.basename(entry.path),
			entry.year, moment(entry.month + 1, "M", "HU").format("MMMM"),
			entry.employeeCount,
			moment(entry.modified).locale("HU").calendar(),
			entry.path]))

		function importRecentSheet(path: string) {
			loading.value = true
			ipcRenderer.send("import", path)
		}

		function reveal(path: string) {
			ipcRenderer.send("reveal-in-explorer", path)
		}

		return {
			newSheetDialog,
			loading,
			datePicker,
			selection,
			employees,
			recents,
			importRecentSheet,
			reveal
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
	<div class="wrapper" v-if="!loading">
		<v-dialog v-model="newSheetDialog" width="unset" height="80%">
			<template v-slot:activator="{ on, attrs }">
				<div class="sheet new-sheet-button" v-bind="attrs" v-on="on">
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
				<employee-table class="employeeTable" v-model="selection" :defaultSelection="employees"></employee-table>
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
		<button v-ripple class="sheet"
			v-for="[filename, year,month,numEmployees, timeAgo, path] in recents"
			:key="path"
			@click="importRecentSheet(path)">

			<v-btn fab x-small plain class="reveal-in-explorer" @click.stop="reveal(path)">
				<v-icon>mdi-open-in-new</v-icon>
			</v-btn>

			<span class="font-weight-bold overline">
				<v-icon color="info">mdi-calendar</v-icon>
				<br>
				{{year}}. {{month}}
			</span>
			<span class="filename">
				<v-icon color="green">mdi-microsoft-excel</v-icon>
				<br>
				{{filename}}
			</span>
			<span class="caption">
				<v-icon color="secondary">mdi-account-multiple</v-icon>
				{{numEmployees}} dolgozó
			</span>
			<div class="timeAgo caption">
				<v-icon>mdi-file-clock-outline</v-icon>
				<span>
					Módosítva: <br> {{timeAgo}}

				</span>
			</div>

		</button>
	</div>
	<div class="pt-10 text-center" v-else>
		<v-progress-circular
			indeterminate
			color="grey"
			:size="50"></v-progress-circular>
	</div>
</template>

<style scoped lang="scss">
.employeeTable {
	flex-direction: column;
	flex-grow: 1;
}
.dialog {
	min-width: 400px;
	max-width: 600px;
}
.sheet {
	border: 3px solid #ccc;
	background: #fff;
	display: flex;
	position: relative;
	align-items: center;
	flex-direction: column;
	justify-content: space-evenly;
	width: 200px;
	height: 300px !important;
	gap: 5px;
	border-radius: 20px;

	&:hover {
		filter: brightness(98%);
		& > .v-icon {
			transform: scale(110%);
		}
	}
	.filename {
		padding: 10px;
		text-align: center;
		max-width: 200px;
		word-wrap: break-word;
	}
	.timeAgo {
		display: flex;
		gap: 5px;
		text-align: left;
		font-style: italic;
	}
}
.new-sheet-button {
	justify-content: center;
}
.reveal-in-explorer {
	top: 0;
	right: 0;
	position: absolute;
}
.wrapper {
	display: flex;
	align-content: center;
	justify-content: center;
	height: 100%;
	gap: 3% 3%;
	flex-wrap: wrap;
}
</style>
