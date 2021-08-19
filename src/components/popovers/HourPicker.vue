// Input style based on https://codepen.io/prasanthmj/pen/EWQPrK

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
		add(n: number) : void{
			this.$emit('input', this.value + n);
			(this.$refs.field as HTMLInputElement).select();
		},
		keydown(e: KeyboardEvent) {
			if (e.key == "+") {
				this.add(1);
				e.preventDefault();
			}
			else if (e.key == "-") {
				this.add(-1)
				e.preventDefault();
			}
		}
	}
})
</script>

<template>
	<div class="wrapper">
		<input type="number" min="0" max="23" step="1" ref="field"
			v-bind:value="value"
			@input="$emit('input', $event.target.value)"
			@focus="$event.target.select()"
			@keydown="keydown">

		<div class="spinner-nav">
			<div class="spinner-button plus" v-ripple @click="add(1)">+</div>
			<div class="spinner-button minus" v-ripple @click="add(-1)">-</div>
		</div>
	</div>
</template>

<style scoped>
.wrapper {
	position: relative;
}

input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
	-webkit-appearance: none;
	margin: 0;
}

.wrapper input {
	padding-right: 20px !important;
	height: 42px;
	line-height: 1.65;
	float: left;
	display: block;
	padding: 0;
	margin: 0;
	border: 1px solid #eee;
	text-align: center;
}

.wrapper input:focus {
	outline: 0;
}

.spinner-nav {
	float: left;
	position: relative;
	height: 42px;
}

.spinner-button {
	position: absolute;
	height: 50%;
	cursor: pointer;
	border-left: 1px solid #eee;
	width: 20px;
	text-align: center;
	color: #333;
	font-size: 0.8em;
	line-height: 1.6;
	transform: translateX(-100%);
	user-select: none;
}

.spinner-button.plus {
	top: 0;
	border-bottom: 1px solid #eee;
}

.spinner-button.minus {
	bottom: 0px;
}

.spinner-button:hover {
	background: #eee;
}
</style>