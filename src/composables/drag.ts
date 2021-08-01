import {ref, Ref, reactive} from "@vue/composition-api"

export default function drag(rectUpdate: Function, popover: Ref<boolean>) {
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
		if (drag.dragging) {
			drag.end = day;
			popover.value = true;
		}
		rectUpdate();
		drag.dragging = false;
	}
	const dragEndEmpty = () => {
		dragEnd(drag.employee_index, drag.end);
	}

	return { drag, dragStart, dragEnter, dragEnd, dragEndEmpty }
}