<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
	props: {
		visibility: {
			type: Boolean,
			default: false
		},
	},
	computed: {
		style_visibility() {
			return {
				visibility: this.visibility ? "visible" : "hidden",
				opacity: this.visibility ? 1 : 0
			}
		}
	}
})
</script>

<template>
	<div :style="style_visibility" class="wrapper">
		<slot></slot>
	</div>
</template>

<style scoped>
/* Use vw unit, so that the size dosen't change with zoom*/
div.wrapper {
	position: absolute;
	bottom: 1vw;
	left: 1vw;
	width: 10vw;
	min-width: 10vh;
	padding: 0.5vw 1vw;
	border-radius: 1vh;
	box-shadow: 0 0 0.5vw #1f1f1f;
	letter-spacing: 0.1vw;
	background-color: var(--v-secondary-base);
	text-align: center;
	font-size: 2vh;
	color: #fff;
	transition: visibility 0.3s linear, opacity 0.3s linear;
	z-index: 1000;
	pointer-events: none;
}
</style>