<script lang="ts">
import Vue from 'vue'
import { DayType, DayTypeDescriptions } from "@/model/day-types";
import { capitalize } from "lodash"
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
			type: String,
			default: ""
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
			if (e.key.toLowerCase() == this.accelerator.toLowerCase()) {
				this.click();
			}
		}
	},
	computed: {
		desc() {
			return DayTypeDescriptions[this.type]
		},
		keybind(){
			return capitalize(this.accelerator)
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
		<span>{{tooltip}}  <kbd :dark="false">{{keybind}}</kbd></span>
		
	</v-tooltip>

</template>

<style>
.fab:focus::before {
	opacity: 0 !important;
}
.fab:hover::before {
	opacity: 0.15 !important;
}
/* .theme--light.v-application kbd {
    background: #e8e8e8;
    color: #000000;
} */
</style>