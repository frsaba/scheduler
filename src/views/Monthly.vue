<script lang="ts">
import Vue from "vue";
import { DayType, Sheet } from "@/schedule-sheet";
import MonthlyRow from "@/components/MonthlyRow.vue";
import Popover from "@/components/Popover.vue";
import debounce from "lodash/debounce"
export default Vue.extend({
	name: "Monthly",
	components: {
		MonthlyRow,
		Popover,
	},
	data() {
		return {
			x: 1,
			sheet: new Sheet(2021, 2),
			drag: false,
			drag_employee: "",
			drag_start: 0,
			drag_end: 0,
			popover: false,
			selection_start_rect: new DOMRect(),
			selection_end_rect: new DOMRect(),
			scroll : function (){}
		};
	},
	mounted() {
		this.sheet.AddRow("Példa János");
		this.sheet.GetRow("Példa János").GetDay(2).SetShift(19, 8);
	},
	created() {
		window.addEventListener("mouseup", this.dragEndEmpty);
		this.scroll = debounce(this.fixPopoverTransition, 50)
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
		getBounds(day: number, name = '') : DOMRect{
			if(!name) name = this.drag_employee
			return this.getDayElement(name,day).getBoundingClientRect();
		},
		add() {
			this.sheet.AddRow("Példa János" + this.x);
			this.x++;
		},
		shift(name: string, day: number) {
			let row = this.sheet.GetRow(name);
			if (row.GetDay(day).type == DayType.empty) {
				row.SetShift(day, 10, 8);
			} else {
				row.DeleteShift(day);
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
				for (let i = this.selection_start; i <= this.selection_end; i++) {
					this.shift(this.drag_employee, i);
				}
				this.popover = true;
			}
			this.updateSelectRects();
			this.drag = false;
		},
		dragEndEmpty() {
			this.dragEnd(this.drag_employee, this.drag_end);
		},
		deselect(){
			this.drag_employee = '';
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
		fixPopoverTransition(){ 
			//transitions are not normally applied when popover is moved, so visibility is toggled
			this.updateSelectRects();
			this.popover = false;
			this.$nextTick(() => {
				this.popover = true;
			});
		}
	},
	computed: {
		selection_start(): number {
			return Math.min(this.drag_start, this.drag_end);
		},
		selection_end(): number {
			return Math.max(this.drag_start, this.drag_end);
		},
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
			:selected_start="selection_start_rect"
			:selected_end="selection_end_rect"
		></popover>
		<div class="table-wrapper" @scroll="scroll">
			<table fixed-header class="table" ref="asd">
				<thead>
					<tr>
						<th class="text-center nametag">Név</th>
						<th
							class="text-center"
							v-for="n in sheet.month_length"
							:key="n"
						>
							{{ n }}
						</th>
					</tr>
				</thead>
				<tbody>
					<monthly-row
						v-for="row in this.sheet.schedule"
						:key="row.employee_name"
						:employee_name="row.employee_name"
						:days="row.days"
						:selection_start="
							row.employee_name == drag_employee
								? selection_start
								: null
						"
						:selection_end="
							row.employee_name == drag_employee
								? selection_end
								: null
						"
						:ref="row.employee_name"
						@day-mouse-down="dragStart(row.employee_name, $event)"
						@day-mouse-up="dragEnd(row.employee_name, $event)"
						@day-mouse-enter="dragEnter(row.employee_name, $event)"
					/>
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
}

thead th:first-child {
	left: 0;
	z-index: 1;
}

tbody th {
	position: sticky;
	left: 0;
	background: #fff;
	border: 1px solid #ccc;
}
</style>
