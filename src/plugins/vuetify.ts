import Vue from "vue";
import Vuetify from "vuetify/lib/framework";
import colors from 'vuetify/lib/util/colors'

Vue.use(Vuetify);

let defaults = {
    primary: "#007BFF",
    secondary: "#424242",
    accent: "#82B1FF",
    error: "#FF5252",
    info: "#2196F3",
    success: "#4CAF50",
    warning: "#FFC107",
}

export default new Vuetify({
    theme: {
        options: {
            customProperties: true,
        },
        themes: {
            light: {
                ...defaults,

                shift: "#FFFFFF",
                paid: defaults.warning,
                unpaid: colors.green.base,
                holiday: colors.purple.base,
                free_weekend: defaults.primary,
                rest: colors.indigo.base,
                sick: colors.pink.base,
                empty: "#FFFFFF",
                
                "selected-border" : "#1f1f1f",
                "header-weekend": "#4f4f4f",
                "header-weekday": "#000000"
            },
        },
    },
});
