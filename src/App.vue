<script lang="ts">
import Vue from "vue";
import Snackbar from "@/components/Snackbar.vue";
import UpdateNotification from "./components/UpdateNotification.vue";
import { ipcRenderer } from "electron";
import { debounce } from "lodash";
import replaceTemplate from "@/utils/sheet-to-xlsx"
import parseWithTemplate from "@/utils/xlsx-to-sheet"
import { bufferToWorkbook } from "@/utils/xlsx-helpers"
import { version } from "process";

export default Vue.extend({
	name: "App",
	components: {
		Snackbar,
		UpdateNotification
	},
	data: () => ({
		zoomLevel: 100,
		snackbar: false,
		timeout: 2000,
		hide: function () { },
		routes:
			[["Munkalapok", "/setup", "mdi-file-document-multiple"],
			["Szerkesztő", "/", "mdi-table-edit"],
			["Dolgozók", "/staff", "mdi-account"]],
		version: ""
	}),
	created() {
		this.hide = debounce(() => { this.snackbar = false }, this.timeout);

		ipcRenderer.on("export-query", async (_, templateBuffer: Buffer, path: string) => {
			let workbook = await bufferToWorkbook(templateBuffer)
			let template = workbook.worksheets[0]
			replaceTemplate(template, this.$store.state.sheets.sheet)
			let outBuffer = await workbook.xlsx.writeBuffer()
			ipcRenderer.send("export-reply", outBuffer, path)
		})

		ipcRenderer.on("export-done", (_, path: string, error: Error | undefined) => {
			if (error) return console.error(error)
			this.$store.commit("log_export", { sheet: this.$store.state.sheets.sheet, path })
		})

		ipcRenderer.on("import-query", async (_, templateBuffer: Buffer, targetBuffer: Buffer) => {
			let template = (await bufferToWorkbook(templateBuffer)).worksheets[0]
			let target = (await bufferToWorkbook(targetBuffer)).worksheets[0]
			parseWithTemplate(template, target)
		})

		ipcRenderer.on("zoom", (event, { zoom }) => {
			this.zoomLevel = Math.round(zoom * 100);
			this.snackbar = true;
			this.hide();
		});

		this.$store.dispatch("load")
	},
	mounted() {
		ipcRenderer.invoke("app_version").then((version) => this.version = version)
	},
	destroyed() {
		ipcRenderer.removeAllListeners("export-query")
	}
});
</script>

<template>
	<v-app class="app">
		<update-notification></update-notification>
		<snackbar :visibility="snackbar">
			<v-icon class="magnifier" color="white">mdi-magnify</v-icon>
			Nagyítás:
			<br />
			{{ zoomLevel }}%
		</snackbar>
		<v-app-bar app color="primary" dark>
			<div class="d-flex align-center routes">
				<v-btn
					v-for="[name, route, icon] in routes"
					:key="route"
					outlined
					@click="$router.push(route)"
					:disabled="$router.currentRoute.path == route">
					<v-icon class="navbar-icon">{{ icon }}</v-icon>
					{{ name }}
				</v-btn>
			</div>

			<v-spacer></v-spacer>

			<v-btn
				href="https://github.com/vuetifyjs/vuetify/releases/latest"
				target="_blank"
				text>
				<span class="mr-2">Latest Release {{version}}</span>
				<v-icon>mdi-open-in-new</v-icon>
			</v-btn>
		</v-app-bar>

		<v-main class="view">
			<router-view />
		</v-main>
	</v-app>
</template>

<style scoped>
.routes {
	gap: 15px;
	margin: 10px;
}
.navbar-icon {
	padding-right: 5px;
}
.magnifier {
	font-size: 2vh;
	transition: none;
}
</style>

<style>
html,
body {
	overflow: auto !important;
}
</style>