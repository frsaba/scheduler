function daysInMonth(year: number, month: number) {
    return new Date(year, month, 0).getDate();
}

// export class Sheet {
//     year: number
//     month: number
//     schedule: Map<string, ScheduleRow> = new Map()
//     constructor(_year: number, _month: number) {
//         this.month = _month;
//         this.year = _year;
//     }
//     AddRow(employee_name: string) {
//         this.schedule.set(employee_name, new ScheduleRow(employee_name, daysInMonth(this.year, this.month)))
//     }
//     GetRow(employee_name: string): ScheduleRow {
//         let result = this.schedule.get(employee_name);
//         if (!result) throw new Error(`Nem létezik '${employee_name}' nevű dolgozó!`);
//         return result;
//     }
// }

export class Sheet {
    month_length: number
    schedule: Array<ScheduleRow> = []
    constructor(public year: number, public month: number) {
        this.month_length = daysInMonth(year, month)
    }
    AddRow(employee_name: string) {
        this.schedule.push(new ScheduleRow(employee_name, this.month_length))
    }
    GetRow(employee_name: string): ScheduleRow {
        let result = this.schedule.find(s => s.employee_name == employee_name);
        if (!result) throw new Error(`Nem létezik '${employee_name}' nevű dolgozó!`);
        return result;
    }
}

class ScheduleRow {
    // employee_name : string
    days: Array<ScheduleDay>
    constructor(public employee_name: string, length: number) {
        // this.employee_name = employee_name
        this.days = [...Array(length).keys()].map(d => new ScheduleDay())
    }

    SetShift(day: number, start: number, duration = 12) {
        // this.days[day - 1] = new Shift(start, duration);
        // this.days = this.days.map((x,i) => i == day - 1 ? new Shift(start, duration) : x)
        this.GetDay(day).SetShift(start, duration);
        // this.days = [...this.days]
    }
    DeleteShift(day: number) {
        this.days[day - 1].Clear();
    }
    GetDay(day: number): ScheduleDay {
        if (day < 1 || day > this.days.length) throw new Error("Érvénytelen nap ");

        return this.days[day - 1];
    }

}

class ScheduleDay {

    constructor(
        public type: DayType = DayType.empty,
        public start: number = 0,
        public duration = 0,
    ) { }

    Clear() {
        this.type = DayType.empty
    }
    SetShift(start: number, duration: number) {
        this.type = DayType.shift;
        this.start = start;
        this.duration = duration;
    }
}

export enum DayType {
    shift,
    paid,
    unpaid,
    holiday,
    weekend,
    rest,
    empty
}

// class Shift extends ScheduleDay {
//     public type: "shift" = "shift";
//     constructor(
//         public start: number = 7,
//         public duration = 8,
//     ) { super() }


// }


