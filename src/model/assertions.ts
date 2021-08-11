import { isDay, isNight, isWeekend } from "@/utils/date-helpers";
import { DayType } from "@/model/day-types";
import { ScheduleDay, ScheduleRow } from "@/model/schedule-sheet";
import { groupByWeek, getShiftStartDate, getShiftEndDate } from "@/utils/date-helpers"
import _ from "lodash"
import moment from "moment";

export class ErrorGroup {
	constructor(
		public description: string,
		public days: number[],
		public fatal: boolean,
	) { }
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
					[i - 1, i],
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
				if (!isWeekend(current.date))
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

			if (!isWeekend(current.date)) continue;

			if ((current.type === DayType.weekend) !== (next?.type === DayType.weekend)) {
				result.push(new ErrorGroup(
					this.description,
					[i, i + (isDay(current.date, 6) ? 1 : -1)],
					this.fatal
				))
			} else
				i++
		}

		return result
	}
}

export class MaxHoursPerWeek implements Assertion {
	description: string
	fatal = true

	constructor(public maxHours: number = 48) {
		this.description = `Egy héten maximum ${maxHours} munkaóra lehet megadva!`
	}

	evaluate(row: ScheduleRow) {
		const weeks = groupByWeek(row.days)

		return weeks.reduce((errors: ErrorGroup[], week) => {
			const hours = week.reduce((total, day) => total += day.duration, 0);
			if (hours > this.maxHours)
				errors.push(new ErrorGroup(this.description, week.map((d) => d.day - 1), this.fatal));
			return errors
		}, [])
	}
}

export class MinRestPerWeek implements Assertion {
	description: string
	fatal = true

	constructor(public minRest: number = 40) {
		this.description = `Egy héten legalább ${minRest} óra egybefüggő pihenőidőnek kell maradjon!`
	}

	evaluate(row: ScheduleRow) {
		const weeks = groupByWeek(row.days)

		return weeks.reduce((errors: ErrorGroup[], week) => {
			let restStart = moment(new Date(_.first(week)!.date));
			let weekendDate = moment(new Date(_.last(week)!.date)).add(1, 'd');

			const rests = [] as number[]
			if(week.length < 7) return errors //only check full weeks

			for (let index = 0; index < week.length; index++) {
				let remaining = week.slice(index)
				let nextWorkingDayIndex = remaining.findIndex(d => d.type == DayType.shift)
				let nextWorkingDay = remaining[nextWorkingDayIndex]
				
				//skip ahead beyond the next working day we found
				if(nextWorkingDayIndex >= 0) index += nextWorkingDayIndex

				let restEnd = nextWorkingDay ? moment(getShiftStartDate(nextWorkingDay)) : weekendDate
				
				rests.push(restEnd.diff(restStart, 'hours'))
				// console.log(restStart.toLocaleString(), restEnd.toLocaleString())

				if (!nextWorkingDay) break; //We've delt with the last rest of the week
				restStart = moment(getShiftEndDate(nextWorkingDay))
			}
			// console.log(rests)
			if (_.max(rests)! < this.minRest)
				errors.push(new ErrorGroup(this.description, week.map((d) => d.day - 1), this.fatal))
			return errors
		}, [])
	}
}

export const assertions: Assertion[] = [
	new RestAssertion(),
	new FreeWeekendPlacementAssertion(),
	new FreeWeekendCountAssertion(),
	new MaxHoursPerWeek(48),
	new MinRestPerWeek(40),
]