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
