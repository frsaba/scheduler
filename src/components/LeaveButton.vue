<script lang="ts">
import Vue from 'vue'
import { DayType } from "@/schedule-sheet";
export default Vue.extend({
	name: 'LeaveButton',
	props: {
		type: String,
        color: String,
        tooltip: String
	},
	methods: {
		setType(type: string) {
			let t = DayType[type as keyof typeof DayType]
			this.$emit('set-type', t)
		}
	},
})
</script>

<template>
    <v-tooltip bottom>
      <template v-slot:activator="{ on, attrs }">
        <v-btn class="fab" dark fab @click="setType(type)" :color="color" v-bind="attrs" v-on="on"><slot></slot></v-btn>
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