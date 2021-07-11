<script lang="ts">
import Vue from "vue";
export default Vue.extend({
	name: "Popover",
	props: {
		value: {
			type: Boolean,
			default: false,
		},
	},
	data() {
		return {
			menu: this.value,
		};
	},
	methods: {
		change(e : Event) {
			this.$emit("input", this.menu);
		},
	},
});
</script>

<template>
	<v-menu
		v-model="menu"
		:close-on-content-click="false"
        @change="change"
		:nudge-width="200"
		offset-x
	>
		<v-card>
			<v-icon>edit</v-icon>
		</v-card>
	</v-menu>
</template>