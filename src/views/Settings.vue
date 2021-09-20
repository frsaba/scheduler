<script lang="ts">
import { computed, defineComponent, reactive, ref } from '@vue/composition-api'
import ShiftPicker, { Shift } from "@/components/pickers/ShiftPicker.vue"

export default defineComponent({
	name: "Settings",
	components: {
		ShiftPicker
	},
	setup() {
		let alias_action = reactive({
			edit: false,
			add: false,
			delete: false
		});

		let alias_dialog = computed(() => alias_action.edit || alias_action.add);
		let alias_data = reactive({
			name: "",
			shift: {
				start: 17,
				end: 18,
				duration: 1
			} as Shift
		})

		let alias_headers = [
			{ text: "Név", value: "name" },
			{ text: "Kezdet", value: "start" },
			{ text: "Vég", value: "end" },
			{ text: "", value: "actions", sortable: false, width: "90px" }
		];
		let alias_items = [
			{ name: "Vacsoráztat", start: 18, end: 19 }
		];

		return {
			alias_data,
			alias_headers,
			alias_items,
			alias_action,
			alias_dialog
		}
	},
})
</script>

<template>
	<div class="wrapper">
		<v-data-table
			:headers="alias_headers"
			:items="alias_items"
			hide-default-footer>
			<template v-slot:top>
				<div class="overline top">Idő elnevezések</div>
			</template>
			<template slot="item.actions">
				<div class="actions">
					<v-icon @click.stop="alias_action.edit = true">mdi-pencil</v-icon>
					<v-icon @click.stop="alias_action.delete = true">mdi-delete</v-icon>
				</div>
			</template>
			<template v-slot:footer>
				<div class="footer">
					<v-btn fab x-small outlined @click.stop="alias_action.add = true">
						<v-icon>mdi-plus</v-icon>
					</v-btn>
				</div>
				<v-dialog
					:value="alias_dialog"
					@click:outside="alias_action.edit = false; alias_action.add = false">
					<v-card light>
						<v-text-field v-model="alias_data.name"></v-text-field>
					</v-card>
					<!-- <shift-picker @input="alias_data.shift"></shift-picker> -->
				</v-dialog>
			</template>
		</v-data-table>
	</div>
</template>

<style scoped>
.top {
	padding: 0 10px;
}
.actions {
	display: flex;
	justify-content: space-between;
}
.footer {
	padding: 5px 10px;
}
</style>
