import { computed, reactive, Ref } from "@vue/composition-api"
import { clamp } from "lodash"
import { Sheet } from "@/model/schedule-sheet";

export default function (
	sheet: Sheet,
	popover: Ref<boolean>) 
{
	let lastCursorPos = {
		employee_index: 0,
		end: 1
	};
	const drag = reactive({
		start: 0, end: 0, employee_index: -1, dragging: false
	});

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
		lastCursorPos = {
			employee_index: index,
			end: day
		};
		if (drag.dragging) {
			drag.end = day;
			popover.value = true;
		}
		drag.dragging = false;
	}
	const dragEndEmpty = () => {
		dragEnd(drag.employee_index, drag.end);
	}

	const selection_start = computed(() => Math.min(drag.start, drag.end))
	const selection_end = computed(() => Math.max(drag.start, drag.end))
	const selection = computed((): number[] => {
		//(selection_start: 5, selection_end: 7) => [5,6,7]
		if (selection_end.value == 0) return []
		return Array(selection_end.value - selection_start.value + 1).fill(0).map((x, i) => i + selection_start.value);
	})

	const moveSelection = (dx: number, dy: number, e: KeyboardEvent): void => {
		if (drag.employee_index == -1) {
			drag.employee_index = clamp(lastCursorPos.employee_index, 0, sheet.schedule.length - 1);
			drag.end = lastCursorPos.end;
			drag.start = drag.end;
		}
		else {
			console.log(drag)
			drag.employee_index = clamp(drag.employee_index + dy, 0, sheet.schedule.length - 1)
			drag.end = clamp(drag.end + dx, 1, sheet.month_length)
			drag.start = !e.shiftKey ? drag.end : clamp(drag.start, 1, sheet.month_length);
		}

		popover.value = true;
		lastCursorPos = {
			employee_index: drag.employee_index,
			end: drag.end
		};
	}

	const setSelection = (start: number, end: number, employee_index : number): void => {
		drag.start = clamp(start, 1, sheet.month_length)
		drag.end = clamp(end, 1, sheet.month_length)

		drag.employee_index = clamp(employee_index, 0, sheet.schedule.length - 1)
		popover.value = true;
		lastCursorPos = {
			employee_index: drag.employee_index,
			end: drag.end
		};
	}

	const deselect = () => {
		drag.employee_index = -1;
		drag.start = 0;
		drag.end = 0;
		popover.value = false;
	}

	return {
		drag, dragStart, dragEnter, dragEnd, dragEndEmpty,
		deselect,
		selection_start,
		selection_end,
		selection,
		setSelection,
		moveSelection
	}
}