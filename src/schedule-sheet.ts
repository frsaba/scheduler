function daysInMonth(year: number, month: number) {
    return new Date(year, month, 0).getDate();
}

export class Sheet {
    year: number
    month: number
    schedule: Array<ScheduleRow> = []
    constructor(_year: number, _month: number) {
        this.month = _month;
        this.year = _year;
    }
    AddRow(employee_name: string) {
        this.schedule.push(new ScheduleRow(employee_name, daysInMonth(this.year, this.month)))
    }
}

class ScheduleRow {
    days: Array<ScheduleDay>
    constructor(employee_name: string, length: number) {
        this.days = []
    }
}

class ScheduleDay {
    type: "shift" | "paid" | "unpaid" | "holiday" | "weekend" | "rest" | "empty" = "empty"
}

enum DayType {
    shift,
    paid,
    unpaid
}

class Shift extends ScheduleDay {
    type: "shift" = "shift"
    start: number = 7;
    duration = 8


}

