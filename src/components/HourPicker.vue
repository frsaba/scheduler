<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
	name: "HourPicker",
	props: {
		value: {
			type: Number,
			default: 8
		},
	},
	methods:
	{
		add(n: number) {
			this.$emit('input', this.value + n)
		}
	}
})
</script>

<template>
	<div class="wrapper">
		<v-text-field class="field"
			solo
			autofocus
			hide-details="true"
            v-bind:value="value"
			@input="$emit('input', $event)"
			@focus="$event.target.select()">
		</v-text-field>
		<v-btn x-small class="button plus" tabindex="-1" @click="add(1)">
			<v-icon small> mdi-plus</v-icon>
		</v-btn>
		<v-btn x-small class="button minus" tabindex="-1"  @click="add(-1)">
			<v-icon small> mdi-minus</v-icon>
		</v-btn>
	</div>
</template>

<style scoped>
.wrapper {
	display: grid;
	grid-template-rows: 1fr 1fr;
	grid-template-columns: 2.7em min-content;
	align-items: center;
}
.field {
	grid-column: 1;
	grid-row: 1/3;
	padding: 0;
}
.field >>> input {
	text-align: center;
}
.button {
	grid-column: 2;
	padding: 50px;
	margin: 3px;
}
.plus {
	grid-row: 1;
}
.minus {
	grid-row: 2;
}
.button:focus::before {
	opacity: 0 !important;
}
.button:hover::before {
	opacity: 0.15 !important;
}
</style>