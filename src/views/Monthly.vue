<script lang="ts">
import Vue from "vue";
import { computed, defineComponent, onUnmounted, ref, reactive, watch } from "@vue/composition-api";
import { useActions, useState } from "vuex-composition-helpers";
import { mapGetters } from 'vuex'

import { throttle, debounce, last } from "lodash";

import MonthlyRow from "@/components/monthly/MonthlyRow.vue";
import Popover from "@/components/popovers/Popover.vue";
import BasePopover from "@/components/BasePopover.vue";
import DayInfo from "@/components/popovers/DayInfo.vue"
import EmployeeInfo, { EmployeeInfoOptions } from "@/components/popovers/EmployeeInfo.vue"
import AggregatesContextMenu, { AggregatesContextMenuOptions } from "@/components/popovers/AggregatesContextMenu.vue";
import BaseButton from "@/components/BaseButton.vue"
import EmployeePicker from "@/components/staff/EmployeePicker.vue"
import { DayType } from "@/model/day-types";
import { accumulators } from "@/model/aggregates"
import { Sheet } from "@/model/schedule-sheet";
import { Operation } from "@/state/sheets"
import { FontColorFromBackground } from "@/utils/color-helpers"
import { isWeekend, isHoliday, isDay, weekdaysInMonth, workhoursInMonth } from "@/utils/date-helpers"
import compSelection from "@/composables/selection"
import visibilityTracker from "@/composables/visibility-tracker"
import { ErrorGroup } from "@/model/assertions";
import { Employee } from "@/model/staff";
import store from "@/state/store"
import moment from "moment";
import { ipcRenderer } from "electron";

export default defineComponent({
	name: "Monthly",
	components: {
		MonthlyRow,
		Popover,
		BasePopover,
		DayInfo,
		EmployeeInfo,
		BaseButton,
		EmployeePicker,
		AggregatesContextMenu
	},
	props: {
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
		let onPaneResized = () => {
			// @ts-ignore
			context.refs.base.updateRects()
		}
		const selectionObj = compSelection(sheet, popover);
		const { drag, dragEndEmpty, moveSelection, setSelection, deselect, selection } = selectionObj;

		const selection_elements = computed(() => selection.value.map(e => getDayElement(drag.employee_index, e)))
		const cursor_element = computed(() => (drag.end > 0) ? getDayElement(drag.employee_index, drag.end) : null)

		const selection_tracker = visibilityTracker(selection_elements)

		watch(selection_tracker.anyVisible, (fresh, stale) => {
			if (!drag.dragging)
				popover.value = fresh
		})

		const dayinfo = ref(false)
		const dayinfotarget = ref<Element[]>([])

		const employeeinfo = reactive({
			show: false,
			target: null,
			targetElement: null,
			event: null
		} as EmployeeInfoOptions)

		const aggregatesMenu = reactive(new AggregatesContextMenuOptions(accumulators))

		const employeePicker = ref(false)

		const undo = async () => {
			const batch = await useActions(store, ["undo"]).undo();
			scrollBatchIntoView(batch)
		}
		const redo = async () => {
			const batch = await useActions(store, ["redo"]).redo();
			scrollBatchIntoView(batch)
		}
		let clipboard = ref(false)
		const copy = () => {
			if (selection.value.length === 0) return

			useActions(store, ["copy"]).copy({ employee_index: drag.employee_index, days: selection.value });
			clipboard.value = true
		}
		const cut = () => {
			if (selection.value.length === 0) return

			useActions(store, ["cut"]).cut({ employee_index: drag.employee_index, days: selection.value });
			clipboard.value = true
		}
		const paste = async () => {
			if (selection.value.length === 0) return

			let days = selection.value
			let count = await useActions(store, ["paste"]).paste({ employee_index: drag.employee_index, days });
			if (!count) return
			setSelection(days[0], days[0] + count - 1, drag.employee_index)
		}

		function open(){
			ipcRenderer.send('import');
		}
		function save(){
			ipcRenderer.send('export');
		}

		function scrollBatchIntoView(batch: Operation[]) {
			if (batch?.length > 0) {
				deselect()
				setSelection(batch[0].payload.day, last(batch)!.payload.day, batch[0].payload.index)
				const affected = batch.map(({ payload }) => getDayElement(payload.index, payload.day))

				context.root.$nextTick(() => selection_tracker.scrollIntoView(affected, setTableScroll.value));
			}
		}

		function setDayInfoTarget (target: Element) {
			if (aggregatesMenu.show) return;
			dayinfo.value = true;
			dayinfotarget.value = [target];
		}

		const arrowKeydown = (e: KeyboardEvent) => {
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
					setTableScroll.value(dx * 40, dy * 40)
				} else {
					moveSelection(dx, dy, e)
					context.root.$nextTick(() => selection_tracker.scrollIntoView(selection_elements.value, setTableScroll.value));
				}
			}
		}

		const keydown = (e: KeyboardEvent) => {
			if (e.key == "Escape" && aggregatesMenu.show || employeeinfo.show) {
				aggregatesMenu.show = false;
				employeeinfo.show = false;
				e.stopImmediatePropagation();
			}

			if (e.key == "Alt" && selection.value.length && !dayinfo.value) {
				setDayInfoTarget((context.refs[`header${drag.end}`] as Element[])[0]);
				e.preventDefault();
			}

			if (e.ctrlKey) {
				switch (e.key.toLowerCase()) {
					case "z": return undo();
					case "y": return redo();
					case "c": return copy();
					case "x": return cut();
					case "v": return paste();
					case "s": return save();
					case "o": return open();
				}
			}
		}


		const keyup = (e: KeyboardEvent) => {
			if (e.key == "Alt" && dayinfo.value) {
				dayinfo.value = false;
				e.preventDefault();
			}
		}
		// Without throttling, holding down arrow keys makes the cursor move unreasonably fast,
		// but scrolling unreasonably slow (when combined with smooth scrolling)
		let arrowKeydownThrottled = throttle(arrowKeydown, 100);
		window.addEventListener("keydown", arrowKeydownThrottled);
		onUnmounted(() => window.removeEventListener("keydown", arrowKeydownThrottled))

		window.addEventListener("keydown", keydown);
		onUnmounted(() => window.removeEventListener("keydown", keydown))

		window.addEventListener("keyup", keyup);
		onUnmounted(() => window.removeEventListener("keyup", keyup))

		window.addEventListener("mouseup", dragEndEmpty);
		onUnmounted(() => window.removeEventListener("mouseup", dragEndEmpty))

		// const table_wrapper = ref<Element>(); // <div ref="table">
		let setTableScroll = ref((dx: number, dy: number) => { })
		// @ts-ignore
		const scroll = throttle(() => { context.refs.base.updateRects() }, 50);


		//Uses filter to keep the original order
		const aggregates = computed(() => accumulators.filter(a => aggregatesMenu.selected.includes(a)))

		const right_side_headers = computed((): string[] => {
			return aggregates.value.map(a => a.label)
		})
		//Having this as computed so it's cached and doesn't run on every render
		const header_styles = computed((): Array<any> => {
			return aggregates.value.map((a, i) => ({
				backgroundColor: a.header_color,
				color: FontColorFromBackground(a.header_color),
				right: (aggregates.value.length - 1 - i) * 3 + "em" //right side sticky columns
			}))
		})

		const day_header_style = computed((): Array<any> => {
			return new Array(sheet.month_length).fill(1).map((a, i) => {
				let date = new Date(sheet.year, sheet.month, i + 1)
				let backgroundColor;
				if (isHoliday(date))
					backgroundColor = `var(--v-holiday-base)`
				else
					backgroundColor = `var(--v-header-${isWeekend(date) ? "weekend" : "weekday"}-base)`

				let borderLeft = isDay(date, 1) ? '4px double #333' : ''
				return { backgroundColor, borderLeft }
			})
		})

		const toolbarInfo = computed(() => [
			`${sheet.year}. ${moment(sheet.date, "", "hu").format("MMMM")}`,
			`Havi óraszám: ${workhoursInMonth(sheet.date)}`,
			`SZ: ${weekdaysInMonth(sheet.date, 6)}`, // \xA0 -> non-breaking space
			`P: ${weekdaysInMonth(sheet.date, 0)}`
		])

		return {
			staffCount: ref(4),
			sheet,
			toolbarInfo,
			popover,
			onPaneResized,
			dayinfo,
			dayinfotarget,
			setDayInfoTarget,
			employeeinfo,
			employeePicker,
			aggregatesMenu,
			aggregates,
			...selectionObj,
			scroll,
			undo, redo,
			right_side_headers, header_styles, day_header_style,
			selection_tracker,
			selection_elements,
			cursor_element,
			setTableScroll,
			clipboard,
			open,
			save
		}
	},
	mounted() {
		// if (this.$store.getters['staff/count'] < 1) {
		// 	this.$store.commit("staff/add_employee", "Példa János_Lusta");
		// 	this.$store.dispatch("staff/add", "Példa János");
		// 	this.$store.dispatch("staff/add", "Példa János2");
		// 	this.$store.dispatch("staff/add", "Példa János3");
		// }
		this.staffCount = this.$store.getters['staff/count'];

		const root = this.$refs.table_wrapper as Element
		this.setTableScroll = root.scrollBy.bind(root)
		this.selection_tracker.createObserver(root, `-48px -${48 * 6}px 0px  -160px`)
	},
	watch: {
		aggregates() {
			this.selection_tracker.createObserver(this.$refs.table_wrapper as Element, `-48px -${48 * this.aggregates.length}px 0px  -160px`)
		}
	},
	methods: {
		add() {
			this.$store.dispatch("staff/add", {name : "Példa János" + this.staffCount});
			this.staffCount++;
		},
		setShift({ start, duration }: { start: number, duration: number }) {
			for (let i of this.selection) {
				this.$store.dispatch('set_shift', { index: this.drag.employee_index, day: i, start, duration, origin: "user" } as Operation["payload"])
			}
		},
		setType(type: DayType) {
			for (let i of this.selection) {
				this.$store.dispatch('set_type', { index: this.drag.employee_index, day: i, type, origin: "user" } as Operation["payload"])
			}
		},

		employeeContextMenu(e: MouseEvent, employee: Employee) {
			this.deselect()
			this.employeeinfo.event = e;
			this.employeeinfo.show = true
			this.employeeinfo.target = employee;
			this.aggregatesMenu.show = false;
		},
		aggregatesContextMenu(e: MouseEvent) {
			// this.deselect()
			this.aggregatesMenu.event = e;
			this.aggregatesMenu.show = true;
			this.employeeinfo.show = false;
			this.dayinfo = false;
		}
	},
	computed: {
		...mapGetters(['can_undo', 'can_redo'])
	}
});
</script>

<template>
	<div class="wrapper">
		<v-toolbar class="toolbar">
			<base-button
				v-for="([tooltip, icon, click, { circular, ...rest }], i) in [
					[ 'Beosztásban szereplő dolgozók', 'mdi-account-multiple', () => {employeePicker = true; deselect()}, { color: 'success' }, ],
					[ 'Visszavonás', 		'mdi-undo', undo, { circular: true, disabled: !can_undo }, ],
					[ 'Újra', 				'mdi-redo', redo, { circular: true, disabled: !can_redo }, ],
					[ 'Gyorsdolgozó', 		'mdi-plus', add,  { circular: true }],
					[ 'Fájl megnyitása', 		'mdi-folder-open', open,  { circular: true }],
					[ 'Mentés', 		'mdi-floppy', save,  { circular: true }],
				]"
				:key="i"
				v-bind="{ tooltip, icon, outlined: circular, fab: circular, small: circular, ...rest, }"
				v-on="{click}"></base-button>
			<v-spacer></v-spacer>
			<template v-for="(info, i) in toolbarInfo">
				<v-divider vertical :key="i + 'divider'"></v-divider>
				<div class="overline toolbar-info" :key="i + 'info'">{{info}}</div>
			</template>
		</v-toolbar>

		<popover
			v-model="popover"
			@close="deselect"
			@set-shift="setShift"
			@set-type="setType"
			:selection_elements="selection_elements"
			ref="base">
		</popover>
		<day-info
			:value="dayinfo"
			:targets="dayinfotarget"
			:start_times_cache="start_times" />
		<employee-info :options="employeeinfo" />
		<employee-picker v-model="employeePicker"></employee-picker>
		<aggregates-context-menu :options="aggregatesMenu"></aggregates-context-menu>

		<div class="table-wrapper ma-1" @scroll="scroll" ref="table_wrapper">
			<table fixed-header class="table" v-if="sheet.schedule.length > 0">
				<thead>
					<tr>
						<th class="names-header">Név</th>
						<th
							v-for="day in sheet.month_length"
							:key="day"
							:ref="'header' + day"
							:style="day_header_style[day - 1]"
							@mouseenter="setDayInfoTarget($event.target)"
							@mouseleave="dayinfo = false"
							@contextmenu="aggregatesContextMenu">
							{{ day }}
						</th>
						<th
							class="header-sticky-right"
							v-for="(label, i) in right_side_headers"
							:key="label"
							:style="header_styles[i]"
							@contextmenu="aggregatesContextMenu">
							{{ label }}
						</th>
					</tr>
				</thead>
				<tbody>
					<monthly-row
						v-for="(row, i) in sheet.schedule"
						:key="row.employee.name"
						v-bind="{row, aggregates}"
						:selection="i == drag.employee_index ? selection : []"
						:error_groups="error_groups[i]"
						:ref="row.employee.name"
						@day-mouse-down="dragStart(i, $event)"
						@day-mouse-up="dragEnd(i, $event)"
						@day-mouse-enter="dragEnter(i, $event)"
						@employee-contextmenu="employeeContextMenu($event, row.employee)" />
				</tbody>
			</table>
		</div>
		<div v-if="sheet.schedule.length == 0" class="text-center mt-3">
			Ez a beosztás nem tartalmaz dolgozót. <br />
			<a class="overline" @click="employeePicker = true">
				<v-icon left color="primary">mdi-account-plus</v-icon>
				<span>Dolgozó hozzáadása</span>
			</a>
		</div>
		<v-snackbar light v-model="clipboard" min-width="fit-content" :timeout="2000">
			<v-icon>mdi-content-copy</v-icon> Vágólapra másolva
		</v-snackbar>
	</div>
</template>

<style scoped>
.names-header {
	min-width: 10em;
	border-right-style: double;
}
.header-sticky-right {
	position: sticky;
	z-index: 2;
	min-width: 3em;
}
.table-wrapper {
	overflow: auto;
	position: relative;
	border: 1px solid #eee;
	scroll-behavior: smooth;
	max-height: calc(100vh - 136px);
}
.toolbar >>> .v-toolbar__content {
	gap: 15px;
}
.toolbar-info {
	line-height: 1.2rem;
	text-align: center;
	min-width: fit-content;
}
</style>