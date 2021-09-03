<script lang="ts">
import { ipcRenderer } from "electron"
import { computed, defineComponent, ref } from '@vue/composition-api'
import { compileFunction } from "vm";

export default defineComponent({
	props: {
		// show: {
		// 	type: Boolean,
		// 	default: false
		// }
	},
	setup(props, context) {
		let show = ref(false)
		let downloading = ref(false);
		let message = computed(() => {
			return downloading.value ?
				"Frissítés érhető el. Letöltés folyamatban..." : 
				"Frissítés kész. A változások újraindítás után lépnek érvénybe."
		})

		ipcRenderer.on("update-available", () => {
			show.value = true
			downloading.value = true
		})

		ipcRenderer.on("update-downloaded", () => {
			downloading.value = false
		})

		let close = () => {
			show.value = false
		}

		let restart = () => {
			show.value = false
			ipcRenderer.send("update-install")
		}

		return {
			show,
			downloading,
			message,
			close,
			restart
		}
	},
})
</script>

<template>
	<v-snackbar right bottom v-model="show" color="white text-center" :timeout="-1">
		<div class="wrapper">
			<v-progress-circular v-if="downloading" indeterminate color="primary"></v-progress-circular>
			{{ message }}
			<v-btn text v-if="!downloading" color="success" small @click="restart">
				<v-icon left>mdi-restart</v-icon>
				Újraindítás
			</v-btn>
		</div>

		<template v-slot:action="{attrs}">
			<v-btn plain fab x-small @click="close" v-bind="attrs">
				<v-icon color="secondary">mdi-close</v-icon>
			</v-btn>
		</template>
	</v-snackbar>
</template>

<style scoped>
.wrapper {
	display: flex;
	width: 100%;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
	background-color: white;
	color: var(--v-secondary-base);
}
</style>