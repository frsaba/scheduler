import Vuetify from "@/plugins/vuetify";

export enum DayType {
    shift,
    paid,
    unpaid,
    holiday,
    weekend,
    rest,
    sick,
    empty
}

export interface DayTypeDescription {
	type: string,
	color: string,
	desc: string,
	label: string
}

let theme = Vuetify.userPreset.theme!.themes!.light!

export const DayTypeDescriptions = [
    { type: "shift", 	color: theme.shift,         desc: "Műszak",             label: "M"},
    { type: "paid", 	color: theme.paid,          desc: "Fizetett szabadság", label: "FSZ"  },
    { type: "unpaid", 	color: theme.unpaid,        desc: "Szabadnap", 	        label: "SZ/P" },
    { type: "holiday", 	color: theme.holiday,       desc: "Fizetett ünnep",     label: "FÜ"   },
    { type: "weekend", 	color: theme.free_weekend,  desc: "Szabad hétvége",     label: "SZH"  },
    { type: "rest", 	color: theme.rest,          desc: "Pihenőnap", 	        label: "*"    },
    { type: "sick", 	color: theme.sick, 	        desc: "Táppénz", 			label: "TP"   },
    { type: "empty", 	color: theme.empty,         desc: "Üres", 			    label: "-"    }
] as DayTypeDescription[]
