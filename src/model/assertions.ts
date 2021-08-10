import { isDay, isNight, isWeekend } from "@/utils/date-helpers";
import { DayType } from "./day-types";
import { ScheduleRow } from "./schedule-sheet";

export class ErrorGroup {
	constructor (
		public description: string,
		public days: number[],
		public fatal: boolean,
	) {}
}

interface Assertion {
	description: string,
	fatal: boolean,
	evaluate: (row: ScheduleRow) => ErrorGroup[]
}

export class RestAssertion implements Assertion {
	description = "Nincs pihenőnap éjszaka után"
	fatal = true

	evaluate(row: ScheduleRow) {
		let result: ErrorGroup[] = []
		for (let i = 1; i < row.days.length; i++) {
			const previous = row.days[i - 1];
			const current = row.days[i];
			
			if (isNight(previous) && current.type !== DayType.rest && !isNight(current)) {
				result.push(new ErrorGroup(
					this.description,
					[i-1, i],
					this.fatal
				))
			}
		}
		return result
	}
}

export class FreeWeekendPlacementAssertion implements Assertion {
	description = "Szabad hétvége nem hétvégén van"
	fatal = false

	evaluate(row: ScheduleRow) {
		let result: ErrorGroup[] = []
		for (let i = 0; i < row.days.length; i++) {
			const current = row.days[i];
			
			if (current.type === DayType.weekend) {
				if (!isWeekend(new Date(row.sheet.year, row.sheet.month - 1, i + 1)))
					result.push(new ErrorGroup(
						this.description,
						[i],
						this.fatal
					))
			}
		}

		return result
	}
}

export class FreeWeekendCountAssertion implements Assertion {
	description = "Szabad hétvégéből pontosan kettőnek kell legyen egymás mellett"
	fatal = false

	evaluate(row: ScheduleRow) {
		let result: ErrorGroup[] = []

		for (let i = 0; i < row.days.length; i++) {
			const current = row.days[i];
			const next = row.days[i + 1];
			let currDay = new Date(row.sheet.year, row.sheet.month - 1, i + 1);
			if (!isWeekend(currDay)) continue;
			
			if ((current.type === DayType.weekend) !== (next?.type === DayType.weekend)) {
				result.push(new ErrorGroup(
					this.description,
					[i, i + (isDay(currDay, 6) ? 1 : -1)],
					this.fatal
				))
			} else 
				i++
		}

		return result
	}
}

export const assertions: Assertion[] = [
	new RestAssertion(),
	new FreeWeekendPlacementAssertion(),
	new FreeWeekendCountAssertion()
]