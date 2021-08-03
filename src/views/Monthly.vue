<script lang="ts">
import Vue from "vue";
import { computed, defineComponent, onUnmounted, ref, watch } from "@vue/composition-api";
import { useActions, useState } from "vuex-composition-helpers";

import { throttle, debounce } from "lodash";

import MonthlyRow from "@/components/MonthlyRow.vue";
import Popover from "@/components/Popover.vue";
import { DayType } from "@/model/day-types";
import { accumulators } from "@/model/aggregates"
import { Sheet } from "@/model/schedule-sheet";
import { FontColorFromBackground } from "@/utils/color-helpers"
import { isWeekend } from "@/utils/date-helpers"
import { getCenter, getDistance } from "@/utils/rect-helpers"
import compSelection from "@/composables/selection"
import visibilityTracker from "@/composables/visibility-tracker"

export default defineComponent({
	name: "Monthly",
	components: {
		MonthlyRow,
		Popover,
	},
	setup(props, context) {
		const sheet: Sheet = useState(["sheets"]).sheets.value.sheet;

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

		// Selection
		const popover = ref(false)
		const selectionObj = compSelection(sheet, popover, getBounds);
		const { drag, dragEndEmpty, moveSelection, updateRects, selection } = selectionObj;

		const selection_elements = computed(() => selection.value.map(e => getDayElement(drag.employee_index, e)))
		const cursor = computed(() => (drag.end > 0) ? [getDayElement(drag.employee_index, drag.end)] : [])

		const selection_tracker = visibilityTracker(selection_elements)
		const cursor_tracker = visibilityTracker(cursor)
		watch(selection_tracker.anyVisible, (fresh, stale) => {
			popover.value = fresh
		})

		const undo = useActions(["undo"]).undo
		const redo = useActions(["redo"]).redo

		const keydown = (e: KeyboardEvent) => {
			const bindings = {
				"ArrowRight": [1, 0],
				"ArrowLeft": [-1, 0],
				"ArrowUp": [0, -1],
				"ArrowDown": [0, 1]
			}
			if (e.ctrlKey) {
				if (e.key == "z") undo(); // CTRL + Z
				if (e.key == "y") redo(); // CTRL + Y
			}
			const bind = Object.entries(bindings).find(b => b[0] == e.key)
			if (bind) {
				const [dx, dy] = bind[1] as [number, number]
				if (e.ctrlKey) {
					setTableScroll(dx * 40, dy * 40)
				} else {
					const old_distance = getDistance(cursor_tracker.bounds.value, cursor.value[0])
					moveSelection(dx, dy, e)
					// console.log(cursor.value[0])
					const new_distance = getDistance(cursor_tracker.bounds.value, cursor.value[0])
					
					if (cursor_tracker.isVisible(cursor.value[0]) == false && new_distance > old_distance) {
						setTableScroll(dx * 48, dy * 56)
					}
				}
			}
		}
		// Without throttling, holding down arrow keys makes the cursor move unreasonably fast,
		// but scrolling unreasonably slow (when combined with smooth scrolling)
		let keydownThrottled = throttle(keydown, 100);
		window.addEventListener("keydown", keydownThrottled);
		onUnmounted(() => window.removeEventListener("keydown", keydownThrottled))

		window.addEventListener("mouseup", dragEndEmpty);
		onUnmounted(() => window.removeEventListener("mouseup", dragEndEmpty))

		const table_wrapper = ref<Element>(); // <div ref="table">
		const targetscrollTop = ref(0)
		const targetscrollLeft = ref(0)
		const setTableScroll = (left: number, top: number): void => {
			if (table_wrapper.value) {
				targetscrollTop.value += top
				table_wrapper.value.scrollTop = targetscrollTop.value

				targetscrollLeft.value += left
				table_wrapper.value.scrollLeft = targetscrollLeft.value
			}
		}
		const scroll = debounce(updateRects, 50);

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
			staffCount: ref(4),
			sheet,
			popover,
			...selectionObj,
			scroll,
			undo, redo,
			right_side_headers, header_styles, day_header_style,
			table_wrapper,
			selection_tracker,
			cursor,
			cursor_tracker,
			targetscrollTop,
			targetscrollLeft
		}
	},
	mounted() {
		if (this.$store.getters['staff/count'] < 1) {
			this.$store.commit("staff/add_employee", "Példa János_Lusta");
			this.$store.dispatch("staff/add", "Példa János");
			this.$store.dispatch("staff/add", "Példa János2");
			this.$store.dispatch("staff/add", "Példa János3");
		}
		this.staffCount = this.$store.getters['staff/count'];

		const root = this.$refs.table_wrapper as Element
		this.selection_tracker.createObserver(root, `-48px -${48 * 6}px 0px  -160px`)
		this.cursor_tracker.createObserver(root, `-120px -${48 * 6 + 72}px -72px  -232px`, 0.95)

	},
	methods: {
		add() {
			this.$store.dispatch("staff/add", "Példa János" + this.staffCount);
			this.staffCount++;
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
			:selected_end="selection_rects.end"
		></popover>
		<div class="table-wrapper" @scroll="scroll" ref="table_wrapper">
			<table fixed-header class="table">
				<thead>
					<tr>
						<th class="text-center nametag">Név</th>
						<th
							class="text-center"
							:style="day_header_style[n - 1]"
							v-for="n in sheet.month_length"
							:key="n"
						>
							{{ n }}
						</th>
						<th
							class="header-sticky-right acc-header"
							v-for="(acc, i) in right_side_headers"
							:key="acc"
							:style="header_styles[i]"
						>
							{{ acc }}
						</th>
					</tr>
				</thead>
				<tbody>
					<monthly-row
						v-for="(row, i) in sheet.schedule"
						:key="row.employee.name"
						:employee_name="row.employee.name"
						:days="row.days"
						:selection="i == drag.employee_index ? selection : []"
						:ref="row.employee.name"
						@day-mouse-down="dragStart(i, $event)"
						@day-mouse-up="dragEnd(i, $event)"
						@day-mouse-enter="dragEnter(i, $event)"
					/>
				</tbody>
			</table>
		</div>
		{{ cursor_tracker.anyVisible }}
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
