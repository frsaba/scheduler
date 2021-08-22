<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api'
import { useState, useActions } from "vuex-composition-helpers"
import { Sheet } from '@/model/schedule-sheet';
import { Employee } from '@/model/staff';
import { Aggregate } from '@/model/aggregates';

export class AggregatesContextMenuOptions {
	show: boolean = false;
	event: MouseEvent | null = null;
	items: Aggregate[];
	selected: Aggregate[];
	constructor(
		aggregates: Aggregate[],
	) {
		this.items = aggregates;
		this.selected = aggregates;
	}

}

export default defineComponent({
	name: 'AggregatesContextMenu',
	props: {
		options: {
			type: Object as () => AggregatesContextMenuOptions,
			required: true
		},
	},
	setup(props) {
		// const sheet: Sheet = useState(['sheets']).sheets.value.sheet;
		const x = computed(() => props.options.event?.clientX);
		const y = computed(() => (props.options.event?.clientY ?? 0) + 20);


		const remove = useActions(['remove_employee']).remove_employee

		return {
			x, y,
			remove
		}
	},
})
</script>

<template>
	<v-menu
		v-model="options.show"
		:position-x="x"
		:position-y="y"
		absolute
		offset-y
		class="menu"
		:close-on-content-click="false">
		<v-list dense>
			<v-list-item-group
				v-model="options.selected"
				multiple>
				<template v-for="(item, i) in options.items">
					<v-list-item
						:key="`item-${i}`"
						:value="item"
						active-class="text--accent-4">
						<template v-slot:default="{ active }">
							<v-list-item-content>
								<v-list-item-title v-text="item.label"></v-list-item-title>
							</v-list-item-content>

							<v-list-item-action>
								<v-checkbox
									:input-value="active"
									color="primary accent-4"></v-checkbox>
							</v-list-item-action>
						</template>
					</v-list-item>
				</template>
			</v-list-item-group>
		</v-list>
	</v-menu>
</template>

<style scoped lang="scss">
.menu {
	z-index: 10;
}
.theme--light.v-list-item--active {
	&::before {
		opacity: 0;
	}
	&:hover:before {
		opacity: 0.12;
	}
}
</style>