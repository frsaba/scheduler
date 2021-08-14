<script lang="ts">
import Vue from "vue";
import Snackbar from "@/components/Snackbar.vue";
import { ipcRenderer } from "electron";
import { debounce } from "lodash";
import replaceTemplate, { bufferToWorkbook } from "@/utils/sheet-to-xlsx"

export default Vue.extend({
	name: "App",
	components: {
		Snackbar
	},
	data: () => ({
		zoomLevel: 100,
		snackbar: false,
		timeout: 2000,
		hide: function () { },
		routes:
			[["Munkalapok", "/setup", "mdi-file-document-multiple"],
			["Szerkesztő", "/", "mdi-table-edit"],
			["Dolgozók", "/staff", "mdi-account"]]
	}),
	created() {
		this.hide = debounce(() => { this.snackbar = false }, this.timeout);

		ipcRenderer.on("export-query", async (_, templateBuffer: Buffer) => {
			let workbook = await bufferToWorkbook(templateBuffer)
			let template = workbook.getWorksheet("Main")
			await replaceTemplate(template, this.$store.state.sheets.sheet)
			let outBuffer = await workbook.xlsx.writeBuffer()
			ipcRenderer.send("export-reply", outBuffer)
		})

		ipcRenderer.on("zoom", (event, { zoom }) => {
			this.zoomLevel = Math.round(zoom * 100);
			this.snackbar = true;
			this.hide();
		});
	},
	destroyed() {
		ipcRenderer.removeAllListeners("export-query")
	}
});
</script>

<template>
	<v-app>
		<snackbar :visibility="snackbar"> Nagyítás: {{ zoomLevel }}% </snackbar>
		<v-app-bar app color="primary" dark>
			<div class="d-flex align-center routes">
				<v-btn
					v-for="[name, route, icon] in routes"
					:key="route"
					outlined
					@click="$router.push(route)"
					:disabled="$router.currentRoute.path == route"
				>
					<v-icon>{{ icon }}</v-icon>
					{{ name }}
				</v-btn>
			</div>

			<v-spacer></v-spacer>

			<v-btn
				href="https://github.com/vuetifyjs/vuetify/releases/latest"
				target="_blank"
				text
			>
				<span class="mr-2">Latest Release</span>
				<v-icon>mdi-open-in-new</v-icon>
			</v-btn>
		</v-app-bar>

		<v-main>
			<router-view />
		</v-main>
	</v-app>
</template>



<style scoped>
.routes {
	gap: 15px;
	margin: 10px;
}
.v-icon {
	padding-right: 5px;
}
</style>
