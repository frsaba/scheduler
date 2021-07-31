<script lang="ts">
import Vue from "vue";
import { ipcRenderer } from "electron";
import { DayType } from "@/model/day-types";
import MonthlyRow from "@/components/MonthlyRow.vue";
import Popover from "@/components/Popover.vue";
import debounce from "lodash/debounce";
import { accumulators } from "@/model/aggregates"
import { FontColorFromBackground } from "@/utils/color-helpers"
import { isWeekend } from "@/utils/date-helpers"
import { clamp, throttle } from "lodash";
import staff, { Employee } from "@/model/staff"
import { useActions, useState } from "vuex-composition-helpers";
import { Sheet } from "@/model/schedule-sheet";
import { computed, defineComponent, onMounted, onUnmounted, reactive, Ref, ref } from "@vue/composition-api";

export default defineComponent({
	name: "Monthly",
	components: {
		MonthlyRow,
		Popover,
	},
	data() {
		return {
			x: 4,
		};
	},
    setup(props, context) {
        // Sheet
        const sheet: Sheet = useState(["sheets"]).sheets.value.sheet;

        // Drag
        const popover = ref(false);
        const drag = reactive({
            start: 0, end: 0, employee_index: -1, dragging: false
        });

        const drag_employee = computed((): Employee | undefined => {
			try {
				return sheet.GetRow(drag.employee_index).employee
			} catch {
				return undefined
			}
		})

        const dragStart = (index: number, day: number) => {
			drag.dragging = true;
			drag.employee_index = index;
			drag.start = day;
			drag.end = day;
			popover.value = false;
		}
		const dragEnter = (index: number, day: number) => {
			if (drag.dragging) {
				drag.end = day;
			}
		}
		const dragEnd = (index: number, day: number) => {
			if (drag.dragging) {
				drag.end = day;
				popover.value = true;
			}
			updateSelectedRects();
			drag.dragging = false;
		}
		const dragEndEmpty = () => {
			dragEnd(drag.employee_index, drag.end);
		}
		const deselect = () => {
			drag.employee_index = -1;
			drag.start = 0;
			drag.end = 0;
			popover.value = false;
		}
        window.addEventListener("mouseup", dragEndEmpty);
        onUnmounted(() => window.removeEventListener("mouseup", dragEndEmpty))

        // Selection
        const selection_rects = reactive({
            start: new DOMRect(),
            end: new DOMRect()
        });
        const selection_start = computed(() => Math.min(drag.start, drag.end))
        const selection_end = computed(() => Math.max(drag.start, drag.end))
        const selection = computed((): number[] => {
			//(selection_start: 5, selection_end: 7) => [5,6,7]
			if (selection_end.value == 0) return []
			return Array(selection_end.value - selection_start.value + 1).fill(0).map((x, i) => i + selection_start.value);
		})

        const getDayElement = (index: number, day: number): Element => {
			let name = sheet.GetRow(index).employee.name
			let row = context.refs[name] as Vue[]; // WARNING: refs depracated

			let currDay = row[0].$children.find((e) => {
				if (!e.$props.day)
					throw `Az '${name}' sornak nincsenek leszármazottjai`;

				return e.$props.day == day;
			});
			if (!currDay) throw `Nem sikerült megtalálni ${day}. oszlopot.`;

			return currDay.$el;
		}

		const getBounds = (day: number, id = -1): DOMRect => {
			if (id < 0) id = drag.employee_index;
			return getDayElement(id, day).getBoundingClientRect();
		}

        const updateSelectedRects = () => {
			if (drag.employee_index === -1) return;
			selection_rects.start = getBounds(selection_start.value);
			selection_rects.end = getBounds(selection_end.value);
        }

        ipcRenderer.on("zoom", () => {
            updateSelectedRects();
        })

        // Move with arrows
        const table = ref<Element>(); // <div ref="table">

        const setTableScroll = (left: number, top: number): void => {
            if (table.value) {
                table.value.scrollLeft += left
                table.value.scrollTop += top
            }
        }

        const arrowKeyDown = (e: KeyboardEvent): void => {
        	const bindings = {
        		"ArrowRight": [1, 0],
        		"ArrowLeft": [-1, 0],
        		"ArrowUp": [0, -1],
        		"ArrowDown": [0, 1]
        	}
        	const bind = Object.entries(bindings).find(b => b[0] == e.key)
        	if (bind) {
        		const [dx, dy] = bind[1] as [number, number]
        		if (e.ctrlKey) {
        			setTableScroll(dx * 40, dy * 40)
        		} else {

        			drag.end = clamp(drag.end + dx, 1, sheet.month_length)
        			if (e.shiftKey == false)
        				drag.start = drag.end;

        			drag.employee_index = clamp(drag.employee_index + dy, 0, sheet.schedule.length - 1)
        			updateSelectedRects()
        		}
        	}
        }

        // Undo - redo

        const undo = useActions(["undo"]).undo
        const redo = useActions(["redo"]).redo
        const undoRedoKeydown = (e: KeyboardEvent): void => {
            if(e.ctrlKey){
				if(e.key == "z") undo(); // CTRL + Z
				if(e.key == "y") redo(); // CTRL + Y
			}
        }
        // Without throttling, holding down arrow keys makes the cursor move unreasonably fast,
		// but scrolling unreasonably slow (when combined with smooth scrolling)
        const keydown = throttle((e: KeyboardEvent): void => {
			undoRedoKeydown(e);
            arrowKeyDown(e);
		}, 100)
        window.addEventListener("keydown", keydown);
        onUnmounted(() => window.removeEventListener("keydown", keydown))

        const scroll = debounce(updateSelectedRects, 50);

        // Styling

        const right_side_headers = computed((): string[] => {
			return accumulators.map(a => a.label)
		})
		//Having this as computed so it's cached and doesn't run on every render
		const header_styles = computed((): Array<any> => {
			return accumulators.map((a, i) => ({
				backgroundColor: a.header_color,
				color: FontColorFromBackground(a.header_color),
				right: (accumulators.length - 1 - i) * 3 + "em" //right side sticky columns
			}))
		})
		const day_header_style = computed((): Array<any> => {
			return new Array(sheet.month_length).fill(1).map((a, i) => ({
				backgroundColor: isWeekend(new Date(sheet.year, sheet.month, i + 1)) ?
					"var(--v-header-weekend-base)" : "var(--v-header-weekday-base)",
			}))
		})

        return {
            sheet,
            popover,
            drag,
            drag_employee,
            dragStart,
            dragEnter,
            dragEnd,
            dragEndEmpty,
            deselect,
            selection_rects,
            selection_start,
            selection_end,
            selection,
            updateSelectedRects,
            scroll,
            undo,
            redo,
            right_side_headers,
            header_styles,
            day_header_style,
            table,
        }
    },
	created() {
		if (this.$store.getters['staff/count'] < 1) {
			this.$store.commit("staff/add_employee", "Példa János_Lusta");
			this.$store.commit("staff/add_employee", "Példa János_Lusta2");
			this.$store.dispatch("staff/add", "Példa János");
			this.$store.dispatch("staff/add", "Példa János2");
			this.$store.dispatch("staff/add", "Példa János3");
		}
	},
	methods: {
		add() {
			this.$store.dispatch("staff/add", "Példa János" + this.x);
			this.x++;
		},
		setShift({ start, duration }: { start: number, duration: number }) {
			for (let i of this.selection) {
				this.$store.dispatch('set_shift', { index: this.drag.employee_index, day: i, start, duration })
			}
		},
		setType(type: DayType) {
			for (let i of this.selection) {
				this.$store.dispatch('set_type', { index: this.drag.employee_index, day: i, type })
			}
		},
	},
});
</script>

<template>
	<div class="wrapper">
		<v-btn color="success" @click="add">Új dolgozó</v-btn>
		<v-btn color="success" @click="undo">Undo</v-btn>
		<v-btn color="success" @click="redo">Redo</v-btn>
		<popover
			v-model="popover"
			@close="deselect"
			@set-shift="setShift"
			@set-type="setType"
			:selected_start="selection_rects.start"
			:selected_end="selection_rects.end"></popover>
		<div class="table-wrapper" @scroll="scroll" ref="table">
			<table fixed-header class="table">
				<thead>
					<tr>
						<th class="text-center nametag">Név</th>
						<th class="text-center" :style="day_header_style[n - 1]" v-for="n in sheet.month_length" :key="n">
							{{ n }}
						</th>
						<th class="header-sticky-right acc-header" v-for="(acc, i) in right_side_headers" :key="acc"
							:style="header_styles[i]">{{acc}}</th>
					</tr>
				</thead>
				<tbody>
					<monthly-row
						v-for="(row, i) in sheet.schedule"
						:key="row.employee.name"
						:employee_name="row.employee.name"
						:days="row.days"
						:selection="i == drag.employee_index ? selection: []"
						:ref="row.employee.name"
						@day-mouse-down="dragStart(i, $event)"
						@day-mouse-up="dragEnd(i, $event)"
						@day-mouse-enter="dragEnter(i, $event)" />
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
	border-right-style: double;
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
	scroll-behavior: smooth;
}
table {
	position: relative;
	border-collapse: separate;
	table-layout: fixed;
	user-select: none;
	border-spacing: 0;
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
