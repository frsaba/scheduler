<script lang="ts">
import Vue from 'vue'
import { DayType, DayTypeDescriptions } from "@/model/day-types";
export default Vue.extend({
	name: 'LeaveButton',
	props: {
		type: Number,
		color: {
			type: String,
			default: function (): string {
				return DayTypeDescriptions[this.type].color
			}
		},
		tooltip: {
			type: String,
			default: function (): string {
				return DayTypeDescriptions[this.type].desc
			}
		},
		accelerator: {
			type: String
		}
	},
	created() {
		window.addEventListener("keydown", this.keydown);
	},
	destroyed() {
		window.removeEventListener("keydown", this.keydown);
	},
	methods: {
		click() {
			this.$emit('click', this.type)
		},
		keydown(e: KeyboardEvent) {
			if(e.key == this.accelerator){
				this.click();
			}
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
		<template v-slot:activator="{ on, attrs }">
			<v-btn class="fab" fab @click="click()" :color="color" v-bind="[$attrs, attrs]" v-on="on">
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