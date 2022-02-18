import Vue from "vue";
import Vuetify from "vuetify";
import { FontColorFromBackground } from "@/utils/color-helpers"
import { DayTypeDescriptions } from "@/model/day-types"
import colors, { Color, Colors } from "vuetify/lib/util/colors"

Vue.use(Vuetify);

export let tagColors = ['deepPurple', 'purple', 'indigo', 'cyan', 'teal', 'orange'].map(x => (colors[x as keyof Colors] as Color)["lighten1"]);
export let tagFontColors = tagColors.map(x => FontColorFromBackground(x));

export default new Vuetify({
	theme: {
		options: {
			customProperties: true,
		},
		themes: {
			light: {
				primary: "#007BFF",
				secondary: "#424242",
				accent: "#82B1FF",
				error: "#FF5252",
				info: "#2196F3",
				success: "#4CAF50",
				warning: "#FFC107",

				...Object.fromEntries(
					DayTypeDescriptions.map(x => [x.type, x.color])
				),
				
				"selected-border": "#1f1f1f",
				"header-weekend": "#4f4f4f",
				"header-weekday": "#000000",
			},
		},
	},
});
