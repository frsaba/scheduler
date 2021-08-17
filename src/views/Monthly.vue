<script lang="ts">
import Vue from "vue";
import { computed, defineComponent, onUnmounted, ref, reactive } from "@vue/composition-api";
import { useActions, useState } from "vuex-composition-helpers";
import { mapGetters } from 'vuex'

import { throttle, debounce, last } from "lodash";

import MonthlyRow from "@/components/MonthlyRow.vue";
import Popover from "@/components/Popover.vue";
import BasePopover from "@/components/BasePopover.vue";
import DayInfo from "@/components/DayInfo.vue"
import EmployeeInfo, { EmployeeInfoOptions } from "@/components/EmployeeInfo.vue"
import BaseButton from "@/components/BaseButton.vue"
import EmployeePicker from "@/components/EmployeePicker.vue"
import { DayType } from "@/model/day-types";
import { accumulators } from "@/model/aggregates"
import { Sheet } from "@/model/schedule-sheet";
import { Operation } from "@/state/sheets"
import { FontColorFromBackground } from "@/utils/color-helpers"
import { isWeekend, isHoliday } from "@/utils/date-helpers"
import compSelection from "@/composables/selection"
import visibilityTracker from "@/composables/visibility-tracker"
import { ErrorGroup } from "@/model/assertions";
import { Employee } from "@/model/staff";

export default defineComponent({
	name: "Monthly",
	components: {
		MonthlyRow,
		Popover,
		BasePopover,
		DayInfo,
		EmployeeInfo,
		BaseButton,
		EmployeePicker
	},
	props:{
		error_groups: Array as () => Array<Array<ErrorGroup>>,
		start_times: Array as () => [number, number[]][]
	},
	setup(props, context) {
		const sheet: Sheet = useState(["sheets"]).sheets.value.sheet;

		const getDayElement = (index: number, day: number): Element => {
			let name = sheet.GetRow(index).employee.name
			let row = context.refs[name] as Vue[];

			// console.log(row[0].$children)

			let currDay = row[0].$children.find((e) => {
				// console.log(e.$props.day)
				if (!e.$props.day)
					throw `Az '${name}' sornak nincsenek leszármazottjai`;

				return e.$props.day == day;
			});
			if (!currDay) throw `Nem sikerült megtalálni ${day}. oszlopot.`;

			return currDay.$el;
		}

		// Selection
		const popover = ref(false)
		const selectionObj = compSelection(sheet, popover);
		const { drag, dragEndEmpty, moveSelection, setSelection, deselect, selection } = selectionObj;

		const selection_elements = computed(() => selection.value.map(e => getDayElement(drag.employee_index, e)))
		const cursor_element = computed(() => (drag.end > 0) ? getDayElement(drag.employee_index, drag.end) : null)

		const selection_tracker = visibilityTracker(selection_elements)
		// watch(selection_tracker.anyVisible, async (fresh, stale) => {
		// 	popover.value = await fresh
		// })

		const dayinfo = ref(false)
		const dayinfotarget = ref()

		const employeeinfo = reactive({
			show: false,
			target: null,
			targetElement: null,
			event: null
		} as EmployeeInfoOptions)

		const employeePicker = ref(false)

		const undo = useActions(["undo"]).undo
		const redo = useActions(["redo"]).redo

		function scrollBatchIntoView(batch: Operation[]) {
			if (batch?.length > 0) {
				deselect()
				setSelection(batch[0].payload.day, last(batch)!.payload.day, batch[0].payload.index)
				const affected = batch.map(({ payload }) => getDayElement(payload.index, payload.day))

				context.root.$nextTick(() => selection_tracker.scrollIntoView(affected, setTableScroll.value));
			}
		}

		const keydown = async (e: KeyboardEvent) => {
			const bindings = {
				"ArrowRight": [1, 0],
				"ArrowLeft": [-1, 0],
				"ArrowUp": [0, -1],
				"ArrowDown": [0, 1]
			}
			if (e.ctrlKey) {
				if (e.key.toLowerCase() == "z") {
					const batch: Operation[] = await undo(); // CTRL + Z
					scrollBatchIntoView(batch)
				}
				if (e.key.toLowerCase() == "y") {
					const batch: Operation[] = await redo(); // CTRL + Y
					scrollBatchIntoView(batch)
				}
			}
			const bind = Object.entries(bindings).find(b => b[0] == e.key)
			if (bind) {
				const [dx, dy] = bind[1] as [number, number]
				if (e.ctrlKey) {
					setTableScroll.value(dx * 40, dy * 40)
				} else {
					moveSelection(dx, dy, e)
					context.root.$nextTick(() => selection_tracker.scrollIntoView(selection_elements.value, setTableScroll.value));
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

		// const table_wrapper = ref<Element>(); // <div ref="table">
		let setTableScroll = ref((dx: number, dy: number) => { })
		// @ts-ignore
		const scroll = throttle(() => { context.refs.base.updateRects() }, 50);

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
			return new Array(sheet.month_length).fill(1).map((a, i) => {
				let date = new Date(sheet.year, sheet.month - 1, i + 1)
				let backgroundColor;
				if (isHoliday(date))
					backgroundColor = `var(--v-holiday-base)`
				else
					backgroundColor = `var(--v-header-${isWeekend(date) ? "weekend" : "weekday"}-base)`

				return { backgroundColor }
			})
		})

		return {
			staffCount: ref(4),
			sheet,
			popover,
			dayinfo,
			dayinfotarget,
			employeeinfo,
			employeePicker,
			...selectionObj,
			scroll,
			undo, redo,
			right_side_headers, header_styles, day_header_style,
			selection_tracker,
			selection_elements,
			cursor_element,
			setTableScroll
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
		this.setTableScroll = root.scrollBy.bind(root)
		this.selection_tracker.createObserver(root, `-48px -${48 * 6}px 0px  -160px`)
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
		setDayInfoTarget(e : Event){
			this.dayinfotarget = [e.target as Element]
		},
		employeeContextMenu(e : MouseEvent, employee : Employee){
			this.deselect()
			this.employeeinfo.event = e;
			this.employeeinfo.target = employee; 
			this.employeeinfo.show = true
		}
	},
	 computed: {
    ...mapGetters(['can_undo','can_redo'])
  }
});
</script>

<template>
	<div class="wrapper">
		<v-toolbar class="toolbar">
			<base-button color="success" @click="employeePicker = true" icon="mdi-account-multiple-plus" tooltip="Dolgozó hozzáadása"></base-button>
			<base-button outlined fab small @click="undo" icon="mdi-undo" tooltip="Visszavonás" :disabled="!can_undo"></base-button>
			<base-button outlined fab small @click="redo" icon="mdi-redo" tooltip="Újra" :disabled="!can_redo"></base-button>			
		</v-toolbar>

		<popover
			v-model="popover"
			@close="deselect"
			@set-shift="setShift"
			@set-type="setType"
			:selection_elements="selection_elements"
			ref="base">
		</popover>
		<day-info :value="dayinfo" :targets="dayinfotarget" :start_times_cache="start_times" />
		<employee-info :options="employeeinfo"/>
		<employee-picker v-model="employeePicker"></employee-picker>

		<div class="table-wrapper ma-1" @scroll="scroll" ref="table_wrapper">
			<table fixed-header class="table" v-if="sheet.schedule.length > 0">
				<thead>
					<tr>
						<th class="text-center nametag">Név</th>
						<th
							class="text-center"
							:style="day_header_style[n - 1]"
							v-for="n in sheet.month_length"
							:key="n"
							@mouseenter="dayinfotarget = [$event.target]; dayinfo = true"
							@mouseleave="dayinfo = false">
							{{ n }}
						</th>
						<th
							class="header-sticky-right acc-header"
							v-for="(acc, i) in right_side_headers"
							:key="acc"
							:style="header_styles[i]">
							{{ acc }}
						</th>
					</tr>
				</thead>
				<tbody>
					<monthly-row
						v-for="(row, i) in sheet.schedule"
						:key="row.employee.name"
						:row="row"
						:selection="i == drag.employee_index ? selection : []"
						:error_groups="error_groups[i]"
						:ref="row.employee.name"
						@day-mouse-down="dragStart(i, $event)"
						@day-mouse-up="dragEnd(i, $event)"
						@day-mouse-enter="dragEnter(i, $event)"
						@employee-contextmenu="employeeContextMenu($event, row.employee)"/>
				</tbody>
			</table>
		</div>
		<div v-if="sheet.schedule.length == 0" class="text-center mt-3">
			Ez a beosztás nem tartalmaz dolgozót. <br>
			<a class="overline" @click="employeePicker = true">
				<v-icon left color="primary">mdi-account-plus</v-icon> 
				<span>Dolgozó hozzáadása</span>
			</a>
		</div>
	</div>
</template>

<style scoped>
.nametag {
	min-width: 10em;
	border-right-style: double;
}
.acc-header {
	min-width: 3em;
}
.header-sticky-right {
	position: sticky;
	z-index: 2;
}
.table-wrapper {
	overflow: auto;
	position: relative;
	border: 1px solid #eee;
	scroll-behavior: smooth;
	max-height: calc(100vh - 100px);
}
.toolbar >>> .v-toolbar__content{
	gap: 15px;
}
</style>