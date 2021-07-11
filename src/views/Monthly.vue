<script lang="ts">
import Vue from "vue";
import { DayType, Sheet } from "@/schedule-sheet";
import MonthlyRow from "@/components/MonthlyRow.vue";
import Popover from "@/components/Popover.vue";
export default Vue.extend({
	name: "Monthly",
	components: {
		MonthlyRow,
        Popover
	},
	data() {
		return {
			x: 1,
			sheet: new Sheet(2021, 2),
			drag: false,
			drag_employee: "",
			drag_start: 0,
			drag_end: 0,
            popover: true
		};
	},
	mounted() {
		this.sheet.AddRow("Példa János");
		this.sheet.GetRow("Példa János").GetDay(2).SetShift(19, 8);
	},
	created() {
		window.addEventListener("mouseup", this.dragEndEmpty);
	},
	destroyed() {
		window.removeEventListener("mouseup", this.dragEndEmpty);
	},
	methods: {
		getDayElement(name: string, day: number): Element {
			let a = this.$refs[name];
			if (a) {
				//@ts-ignore
				return a[0].$children.find((e) => e.day == day).$el;
			} else {
				throw `Nem sikerült megtalálni '${name}' sor  ${day}. oszlopát`;
			}
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
		},
		dragEnter(name: string, day: number) {
			if (this.drag) {
				this.drag_end = day;
			}
		},
		dragEnd(name: string, day: number) {
			if (this.drag) {
				this.drag_end = day;
				const [min, max] = [this.drag_start, this.drag_end].sort(
					(a, b) => a - b
				);
				for (let i = min; i <= max; i++) {
					this.shift(this.drag_employee, i);
				}
				console.log(
					this.getDayElement(name, day).getBoundingClientRect()
				);
			}
			this.drag = false;
            this.popover = true;
		},
		dragEndEmpty() {
			this.dragEnd(this.drag_employee, this.drag_end);
			// this.drag_start = 0;
			// this.drag_end = 0;
		},
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
        <popover v-model="popover"></popover>
		<div class="table-wrapper">
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
