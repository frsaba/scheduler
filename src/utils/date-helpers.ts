import { DayType } from "@/model/day-types";
import { ScheduleDay } from "@/model/schedule-sheet"
import Holidays, { HolidaysTypes } from "date-holidays";
import _ from "lodash";
import moment from "moment";

export function daysInMonth(year: number, month: number): number {
	return new Date(year, month + 1, 0).getDate(); // Month is 0-indexed
}

export function isWeekend(date: Date): boolean {
	let dayOfWeek = date.getDay();
	return (dayOfWeek === 6) || (dayOfWeek === 0); // 6 = Saturday, 0 = Sunday
}

let holidayCache = new Map<number, HolidaysTypes.Holiday[]>()

export function isHoliday(date: Date, filter = (x: HolidaysTypes.Holiday) => x.type === "public") {
	return getHoliday(date, filter) != undefined
}

function getHolidaysFromCache(year: number) {
	if (!holidayCache.has(year))
		holidayCache.set(year, new Holidays("HU").getHolidays(year))
	return holidayCache.get(year)!
}

export function getHoliday(date: Date, filter = (x: HolidaysTypes.Holiday) => true) {
	let holidays = getHolidaysFromCache(date.getFullYear())
	return holidays.filter(filter).find(h => h.start <= date && h.end > date)
}

export function isDay(date: Date, weekday: number): boolean {
	return date.getDay() === weekday
}

export function isNight(shift: ScheduleDay): boolean {
	if (shift.type !== DayType.shift)
		return false;

	return shift.start >= shift.end
}

export function groupByWeek(schedule: ScheduleDay[]): ScheduleDay[][] {
	let groups = _.groupBy(schedule, d => previousMonday(d.date));
	return Object.entries(groups).map(([monday, week]) => week)
}

export function previousMonday(date: Date): Date {
	let weekday: number = date.getDay(); //0 is sunday
	if (weekday == 0) weekday = 7

	return new Date(date.getFullYear(), date.getMonth(), date.getDate() - weekday + 1)
}

export function getShiftStartDate(day: ScheduleDay) {
	if (day.type != DayType.shift) return undefined
	return moment(day.date).add(day.start, 'h').toDate();
}

export function getShiftEndDate(day: ScheduleDay) {
	if (day.type != DayType.shift) return undefined
	return moment(day.date).add(day.start + day.duration, 'h').toDate();
}

export function weekdaysInMonth(date: Date, weekday: number) {
	let momentDate = moment(date)
	momentDate.date(1) // Set the day to the first day
	var dif = (7 + (weekday - momentDate.weekday())) % 7 + 1; // Days between the first and given day
	return Math.floor((momentDate.daysInMonth() - dif) / 7) + 1;
}

export function workhoursInMonth(date: Date) {
	let momentDate = moment(date)
	let workdayCount = momentDate.daysInMonth() - weekdaysInMonth(date, 6) - weekdaysInMonth(date, 0)
	return workdayCount * 8
}