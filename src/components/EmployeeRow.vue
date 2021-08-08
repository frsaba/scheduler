<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api'

export default defineComponent({
	props: {
		name: String
	},
	setup(props, context) {
		const text = ref(props.name)
		return { text }
	},
})
</script>

<template>
	<v-container fluid class="container">
		<v-text-field
			solo
			label="Dolgozó neve"
			:value="name"
			v-model="text"
		></v-text-field>
		<v-btn color="success" @click="$emit('rename', text)">Átnevez</v-btn>
		<v-btn color="error" @click="$emit('remove', text)">Törlés</v-btn>
	</v-container>
</template>

<style scoped>
.container {
	display: flex;
}
</style>