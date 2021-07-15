<script lang="ts">
import Vue from "vue";
import { DayType } from "@/model/day-types";
import MonthlyRow from "@/components/MonthlyRow.vue";
import Popover from "@/components/Popover.vue";
import debounce from "lodash/debounce";
import { accumulators } from "@/model/aggregates"
export default Vue.extend({
	name: "Monthly",
	components: {
		MonthlyRow,
		Popover,
	},
	data() {
		return {
			sheet: this.$store.state.sheets.sheet,
			x: 1,
			drag: false,
			drag_employee: "",
			drag_start: 0,
			drag_end: 0,
			popover: false,
			selection_start_rect: new DOMRect(),
			selection_end_rect: new DOMRect(),
			scroll: function () { },
		};
	},
	created() {
		window.addEventListener("mouseup", this.dragEndEmpty);
		this.scroll = debounce(this.fixPopoverTransition, 50);
		if (this.$store.getters['staff/count'] < 1) {
			this.$store.dispatch("staff/add", "Példa János");
		}
	},
	destroyed() {
		window.removeEventListener("mouseup", this.dragEndEmpty);
	},
	methods: {
		getDayElement(name: string, day: number): Element {
			let row = this.$refs[name] as Vue[];
			if (!row) throw `Nem sikerült megtalálni '${name}' sort.`;

			let currDay = row[0].$children.find((e) => {
				if (!e.$props.day)
					throw `Az '${name}' sornak nincsenek leszármazottjai`;

				return e.$props.day == day;
			});
			if (!currDay) throw `Nem sikerült megtalálni ${day}. oszlopot.`;

			return currDay.$el;
		},
		getBounds(day: number, name = ""): DOMRect {
			if (!name) name = this.drag_employee;
			return this.getDayElement(name, day).getBoundingClientRect();
		},
		add() {
			this.$store.dispatch("staff/add", "Példa János" + this.x);
			this.x++;
		},
		shift(name: string, day: number) {
			let d = this.sheet.GetRow(name).GetDay(day);
			if (d.type == DayType.empty) {
				this.$store.commit('set_shift', { name, day, start: 10, duration: 8 })
			} else {
				this.$store.commit("delete_shift", { name, day });
			}
		},
		setShift({ start, duration }: { start: number, duration: number }) {
			for (let i = this.selection_start; i <= this.selection_end; i++) {
				this.$store.commit('set_shift', { name: this.drag_employee, day: i, start, duration })
			}
		},
		setType(type: DayType) {
			for (let i = this.selection_start; i <= this.selection_end; i++) {
				this.$store.commit('set_type', { name: this.drag_employee, day: i, type })
			}
		},
		dragStart(name: string, day: number) {
			this.drag = true;
			this.drag_employee = name;
			this.drag_start = day;
			this.drag_end = day;
			this.popover = false;
		},
		dragEnter(name: string, day: number) {
			if (this.drag) {
				this.drag_end = day;
			}
		},
		dragEnd(name: string, day: number) {
			if (this.drag) {
				this.drag_end = day;
				this.popover = true;
			}
			this.updateSelectRects();
			this.drag = false;
		},
		dragEndEmpty() {
			this.dragEnd(this.drag_employee, this.drag_end);
		},
		deselect() {
			this.drag_employee = "";
			this.drag_start = 0;
			this.drag_end = 0;
			this.popover = false;
		},
		updateSelectRects(): void {
			//computed properties update immediately which lead to popover moving as it fades out
			if (this.drag_employee == "") return;
			this.selection_start_rect = this.getBounds(this.selection_start);
			this.selection_end_rect = this.getBounds(this.selection_end);
		},
		fixPopoverTransition() {
			//transitions are not normally applied when popover is moved, so visibility is toggled
			this.updateSelectRects();
			this.popover = false;
			this.$nextTick(() => {
				if (this.drag_employee == "") return;
				this.popover = true;
			});
		},

	},
	computed: {
		selection_start(): number {
			return Math.min(this.drag_start, this.drag_end);
		},
		selection_end(): number {
			return Math.max(this.drag_start, this.drag_end);
		},
		selection(): number[] {
			//(selection_start: 5, selection_end: 7) => [5,6,7]
			if (this.selection_end == 0) return []
			return Array(this.selection_end - this.selection_start + 1).fill(0).map((x, i) => i + this.selection_start);
		},
		right_side_headers(): string[] {
			return accumulators.map(a => a.label)
		},
		//Having this as computed so it's cached and doesn't run on every render
		header_styles(): Array<any> {
			return accumulators.map((a, i) => ({
				backgroundColor: a.header_color,
				right: (accumulators.length - 1 - i) * 3 + "em"
			}))
		}
	},
});
</script>

<template>
	<div class="wrapper">
		<v-btn color="success" @click="add">Új dolgozó</v-btn>
		<v-btn color="success" @click="shift">Shift</v-btn>
		<popover
			v-model="popover"
			@close="deselect"
			@set-shift="setShift"
			@set-type="setType"
			:selected_start="selection_start_rect"
			:selected_end="selection_end_rect"></popover>
		<div class="table-wrapper" @scroll="scroll">
			<table fixed-header class="table">
				<thead>
					<tr>
						<th class="text-center nametag">Név</th>
						<th class="text-center" v-for="n in sheet.month_length" :key="n">
							{{ n }}
						</th>
						<th class="header-sticky-right acc-header" v-for="(acc, i) in right_side_headers" :key="acc"
							:style="header_styles[i]">{{acc}}</th>
					</tr>
				</thead>
				<tbody>
					<monthly-row
						v-for="row in this.sheet.schedule"
						:key="row.employee_name"
						:employee_name="row.employee_name"
						:days="row.days"
						:selection="row.employee_name == drag_employee? selection: []"
						:ref="row.employee_name"
						@day-mouse-down="dragStart(row.employee_name, $event)"
						@day-mouse-up="dragEnd(row.employee_name, $event)"
						@day-mouse-enter="dragEnter(row.employee_name, $event)" />
				</tbody>
			</table>
		</div>
	</div>
</template>

<style>
.wrapper {
	max-height: 100%;
}
.nametag {
	min-width: 10em;
	border-right-style:double;
}
.acc-header {
	min-width: 3em;
}
.header-sticky-right {
	position: sticky;
	/* right: 0; */
	z-index: 2;
}
.table-wrapper {
	overflow: auto;
	position: relative;
	border: 1px solid #eee;
	max-height: 75vh;
}
table {
	position: relative;
	border-collapse: separate;
	/* table-layout: fixed; */
	user-select: none;
	border-spacing: 0;
}

td,
th {
	padding: 0.25em;
}

thead th {
	position: sticky;
	top: 0;
	background: #000;
	color: #fff;
	z-index: 1;
}

thead th:first-child {
	left: 0;
	z-index: 2;
}

tbody th {
	position: sticky;
	left: 0;
	background: #fff;
	border: 1px solid #ccc;
}
</style>
