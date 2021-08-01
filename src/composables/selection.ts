import { computed, reactive, ref, Ref } from "@vue/composition-api"
import dragComp from "./drag"
import { clamp } from "lodash"
import { Sheet } from "@/model/schedule-sheet";
import { ipcRenderer } from "electron";

export default function (
	sheet: Sheet,
	popover: Ref<boolean>,
	bounds: (day: number, id?: number) => DOMRect) 
{
	const selection_rects = reactive({
		start: new DOMRect(),
		end: new DOMRect()
	});

	const updateRects = () => {
		if (drag.employee_index === -1) return;
		selection_rects.start = bounds(selection_start.value);
		selection_rects.end = bounds(selection_end.value);
	}

	ipcRenderer.on("zoom", () => {
		updateRects();
	})

	const dragObj = dragComp(updateRects, popover), {drag} = dragObj;

	const selection_start = computed(() => Math.min(drag.start, drag.end))
	const selection_end = computed(() => Math.max(drag.start, drag.end))
	const selection = computed((): number[] => {
		//(selection_start: 5, selection_end: 7) => [5,6,7]
		if (selection_end.value == 0) return []
		return Array(selection_end.value - selection_start.value + 1).fill(0).map((x, i) => i + selection_start.value);
	})

	const moveSelection = (dx: number, dy: number, e: KeyboardEvent): void => {
		drag.end = clamp(drag.end + dx, 1, sheet.month_length)
		if (e.shiftKey == false)
			drag.start = drag.end;

		drag.employee_index = clamp(drag.employee_index + dy, 0, sheet.schedule.length - 1)
		updateRects()
	}

	const deselect = () => {
		drag.employee_index = -1;
		drag.start = 0;
		drag.end = 0;
		popover.value = false;
	}

	return {
		...dragObj,
		deselect,
		selection_start,
		selection_end,
		selection,
		selection_rects,
		moveSelection,
		updateRects
	}
}