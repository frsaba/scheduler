<script lang="ts">
import { computed, defineComponent, reactive, Ref, ref } from '@vue/composition-api'
import { createNamespacedHelpers, } from "vuex-composition-helpers";
import store from "@/state/store"
import { Tag } from "@/model/staff"
import _ from 'lodash';

interface TagItem {
	header?: string,
	text: string,
	color: string
	fontColor: string
}

export default defineComponent({
	props: {
		id: {
			type: Number,
			required: true
		},
		name: {
			type: String,
			required: true
		}
	},
	setup(props, context) {
		const employeeName = ref(props.name);
		const employee = store.state.staff.GetEmployee(props.name);
		let employeeTextbox = ref(null);

		const isEditing = ref(false);
		const { useMutations, useActions, useState } = createNamespacedHelpers(store, "staff");

		function edit() {
			isEditing.value = true;
			(employeeTextbox.value! as HTMLFormElement).focus();
		}
		function rename(oldName: string, newName: string) {
			isEditing.value = false;
			useMutations(["rename"]).rename({ oldName, newName })
		}
		function remove(name: string) {
			useActions(["remove"]).remove(name)
		}
		function cancel() {
			isEditing.value = false;
			(employeeTextbox.value! as HTMLFormElement).blur();
		}

		let tags: Ref<Tag[]> = useState(["tags"]).tags;
		const search = ref("");
		const items = computed(() => {
			return [
				{ header: "Válassz a meglévő kategóriák közül vagy készíts egyet!" },
				...tags.value.map(({name, color, fontColor}) => ({
					text: name,
					color,
					fontColor
				} as TagItem))
			]
		})

		let selectedItems = computed(() => {
			return employee.tags.map((tag) => ({
				text: tag,
				color: tags.value.find(x => x.name === tag)?.color,
				fontColor: tags.value.find(x => x.name === tag)?.fontColor
			}))
		});
		let editItemCombo: Ref<{ text: string } | null> = ref(null);
		const editIndexCombo = ref(-1);

		function filter(item: any, queryText: string, itemText: string) {
			if (item.header) return false

			const hasValue = (val: string) => val != null ? val : ''

			const text = hasValue(itemText)
			const query = hasValue(queryText)

			return text.toString()
				.toLowerCase()
				.indexOf(query.toString().toLowerCase()) > -1
		}

		function editCombo(index: number, item: { text: string }) {
			if (!editItemCombo.value) {
				editItemCombo.value = item
				editIndexCombo.value = index
			} else {
				editItemCombo.value = null
				editIndexCombo.value = -1
			}
		}

		function change(e: (string | TagItem)[]) {
			let tags = e.map(x => typeof x === "string" ? x : x.text)
			// Element added
			if (tags.length > employee.tags.length)
				useActions(["add_tag"]).add_tag({ name: employee.name, tag: _.last(tags) })
			// Element removed
			else {
				let removedTag = employee.tags.find(x => !tags.includes(x))
				useActions(["remove_tag"]).remove_tag({ name: employee.name, tag: removedTag })
			}
		}


		return {
			employeeName, employeeTextbox, edit, cancel, isEditing, rename, remove,
			search, items, filter, editItemCombo, editCombo, change, selectedItems
		}
	}
})
</script>

<template>
	<div class="container">

		<div class="row1">
			<v-text-field
				solo
				label="Dolgozó neve"
				:value="name"
				v-model="employeeName"
				hide-details></v-text-field>
			<v-btn v-if="!isEditing" color="success" @click="edit()">
				<v-icon left>mdi-pencil</v-icon>Átnevezés
			</v-btn>
			<v-btn v-else color="success" @click="rename(name, employeeName)">
				<v-icon left>mdi-check</v-icon>Alkalmaz
			</v-btn>
			<v-btn v-if="!isEditing" color="error" @click="remove(employeeName)">
				<v-icon left>mdi-account-remove</v-icon>Törlés
			</v-btn>
			<v-btn v-else color="error" @click="cancel()">
				<v-icon left>mdi-cancel</v-icon>Mégse
			</v-btn>
		</div>

		<div class="row2">
			<v-combobox
				:value="selectedItems"
				:filter="filter"
				:hide-no-data="!search"
				:items="items"
				:search-input.sync="search"
				hide-selected
				hide-details
				label="Dolgozó címkéi"
				multiple
				small-chips
				solo
				@change="change">
				<template v-slot:no-data>
					<v-list-item>
						<span class="subheading">Létrehoz</span>
						<v-chip
							label
							small>
							{{ search }}
						</v-chip>
					</v-list-item>
				</template>
				<template v-slot:selection="{ attrs, item, parent, selected }">
					<v-chip
						v-if="item === Object(item)"
						v-bind="attrs"
						:input-value="selected"
						:color="item.color"
						:text-color="item.fontColor"
						dark
						label
						small>
						<span class="pr-2">
							{{ item.text }}
						</span>
						<v-icon
							small
							@click="parent.selectItem(item)">
							$delete
						</v-icon>
					</v-chip>
				</template>
				<template v-slot:item="{ index, item }">
					<v-text-field
						v-if="false"
						v-model="editItemCombo.text"
						autofocus
						flat
						background-color="transparent"
						hide-details
						solo
						@keyup.enter="editCombo(index, item)"></v-text-field>
					<v-chip
						v-else
						:color="item.color"
						:text-color="item.fontColor"
						dark
						label
						small>
						{{ item.text }}
					</v-chip>
					<v-spacer></v-spacer>
					<v-list-item-action @click.stop>
						<v-btn
							icon
							@click.stop.prevent="editCombo(index, item)">
							<v-icon>{{ editItemCombo !== item ? 'mdi-pencil' : 'mdi-check' }}</v-icon>
						</v-btn>
					</v-list-item-action>
				</template>
			</v-combobox>
		</div>
		<v-spacer></v-spacer>
		<v-divider></v-divider>
	</div>
</template>

<style lang="scss" scoped>
.container {
	display: flex;
	gap: 10px;
	flex-direction: column;
	// margin: 10px auto;
	width: 50%;
}
.row1 {
	display: flex;
	gap: inherit;
	align-items: center;
}
.subheading {
	padding-right: 5px;
}
</style>