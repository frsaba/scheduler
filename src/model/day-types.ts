import colors from 'vuetify/lib/util/colors'

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

export const DayTypeDescriptions = [
	{ type: "shift",		color: "#FFFFFF",			desc: "Műszak",				label: "M"		},
	{ type: "paid",			color: "#FFC107",			desc: "Fizetett szabadság",	label: "FSZ"	},
	{ type: "unpaid",		color: colors.green.base,	desc: "Szabadnap",			label: "SZ/P"	},
	{ type: "holiday",		color: colors.purple.base,	desc: "Fizetett ünnep",		label: "FÜ"		},
	{ type: "free_weekend", color: "#007BFF",			desc: "Szabad hétvége",		label: "SZH"	},
	{ type: "rest",			color: colors.indigo.base,	desc: "Pihenőnap",			label: "*"		},
	{ type: "sick",			color: colors.pink.base,	desc: "Táppénz",			label: "TP"		},
	{ type: "empty",		color: "#FFFFFF",			desc: "Üres", 				label: "-"		}
] as DayTypeDescription[]
