import { DayType } from "@/model/day-types";
import { ScheduleDay } from "@/model/schedule-sheet"
import Holidays, { HolidaysTypes } from "date-holidays";
import _ from "lodash";
import moment from "moment"

export function daysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate(); // Month is 0-indexed
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

    return Array(shift.duration).fill(0).map((x, i) => (i + shift.start) % 24) // Includes every started hour in a shift
        .filter(x => x >= 22 || x < 6).length > 1; // Counts the hours that are considered as night (between 22 and 6)
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

export function getShiftStartDate(day: ScheduleDay){
    if(day.type != DayType.shift) return undefined
    return moment(day.date).add(day.start, 'h').toDate();
}

export function getShiftEndDate(day: ScheduleDay){
    if(day.type != DayType.shift) return undefined
    return moment(day.date).add(day.start + day.duration, 'h').toDate();
}