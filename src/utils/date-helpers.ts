import { DayType } from "@/model/day-types";
import { ScheduleDay } from "@/model/schedule-sheet"

export function daysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
}

export function isWeekend(date: Date): boolean {
    let dayOfWeek = date.getDay();
    return (dayOfWeek === 6) || (dayOfWeek === 0); // 6 = Saturday, 0 = Sunday
}

export function isDay(date: Date, weekday: number): boolean {
    return date.getDay() === weekday
}

let nightShift: number = 19;
export function isNight(shift: ScheduleDay): boolean
{
    if (shift.type !== DayType.shift)
        return false;
    
    if (shift.start >= nightShift)
        return true;
    
    return false;
}