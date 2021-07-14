<script lang="ts">
import Vue from 'vue'
import { DayType, DayTypeDescriptions } from "@/model/day-types";
export default Vue.extend({
	name: 'LeaveButton',
	props: {
		type: Number,
		color: {
			type: String,
			default: function () : string{
				return DayTypeDescriptions[this.type].color
			}
		},
		tooltip: {
			type: String,
			default: function () : string {
				return DayTypeDescriptions[this.type].desc
			}
		},
		dark: {
			type: Boolean,
			default: true
		},
	},
	methods: {
		setType(type: DayType) {
			this.$emit('set-type', type)
		}
	},
	computed: {
		desc() {
			return DayTypeDescriptions[this.type]
		}
	},
})
</script>

<template>
	<v-tooltip bottom>
		<template v-slot:activator="{ on, attrs }" >
			<v-btn class="fab" fab @click="setType(type)" :dark="dark" :color="color" v-bind="attrs" v-on="on">
				<slot>{{desc.label}}</slot>
			</v-btn>
		</template>
		<span>{{tooltip}}</span>
	</v-tooltip>

</template>

<style>
.fab:focus::before {
	opacity: 0 !important;
}
.fab:hover::before {
	opacity: 0.15 !important;
}
</style>