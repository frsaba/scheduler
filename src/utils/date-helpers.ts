import { DayType } from "@/model/day-types";
import { ScheduleDay } from "@/model/schedule-sheet"
import Holidays, { HolidaysTypes } from "date-holidays";

export function daysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate(); // Month is 0-indexed
}

export function isWeekend(date: Date): boolean {
    let dayOfWeek = date.getDay();
    return (dayOfWeek === 6) || (dayOfWeek === 0); // 6 = Saturday, 0 = Sunday
}

let holidayCache = new Map<number, HolidaysTypes.Holiday[]>()

export function isHoliday(date: Date, filter = (x: HolidaysTypes.Holiday) => x.type === "public") {
	let year = date.getFullYear()
	if (!holidayCache.has(year))
		holidayCache.set(year, new Holidays("HU").getHolidays(year).filter(filter))
	
	let holidays = holidayCache.get(year)!
	return holidays.some(x => x.start <= date && x.end > date)
}

export function isDay(date: Date, weekday: number): boolean {
    return date.getDay() === weekday
}

export function isNight(shift: ScheduleDay): boolean {
    if (shift.type !== DayType.shift)
        return false;

    return Array(shift.duration).fill(0).map((x, i) => (i + shift.start) % 24) // Includes every started hour in a shift
        .filter(x => x >= 22 || x < 6).length > 1; // Counts the hours that are considered as night (between 22 and 6)
}