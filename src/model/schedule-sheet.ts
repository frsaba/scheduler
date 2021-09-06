import { DayType, DayTypeDescriptions } from "./day-types";
import { daysInMonth } from "@/utils/date-helpers"
import staff, { Employee } from "@/model/staff"

export class Sheet {
    month_length: number
    schedule: Array<ScheduleRow> = []

    constructor(public year: number, public month: number, employees: Employee[] = []) {
        this.month_length = daysInMonth(year, month)
        for(const employee of employees){
            this.AddRow(employee)
        }
    }
    AddRow(employee: string | number | Employee) {
        if(typeof employee == "string" || typeof employee == "number") employee = staff.GetEmployee(employee)
        this.schedule.push(new ScheduleRow(this, employee, this.month_length))
    }
    GetRow(employee: string | number): ScheduleRow {

        if (typeof employee == "string") {
            let result = this.schedule.find(r => r.employee.name == employee)
            if (!result) throw new Error(`Nincs '${employee}' nevű dolgozó ezen a munkalapon! `)
            return result;
        }

        return this.schedule[employee];
    }

}

export class ScheduleRow {
    // employee_name : string
    days: Array<ScheduleDay>
    constructor(
        public sheet: Sheet,
        public employee: Employee,
        length: number
    ) {
        // this.employee_name = employee_name
        this.days = [...Array(length).keys()].map(
            d => new ScheduleDay(this, d + 1))
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

export class ScheduleDay {
    date: Date
    constructor(
        public row: ScheduleRow,
        public day: number,
        public type: DayType = DayType.empty,
        public start: number = 0,
        public duration = 0,
    ) {
        this.date = new Date(this.row.sheet.year, this.row.sheet.month, this.day)
    }

	public get end() {
		if (this.type != DayType.shift) throw Error("Az olyan napoknak, amik nem műszakok nincs végső időpontja.")

		let end = (this.start + this.duration) % 24
		return end ? end : 24
	}

    Clear() {
        this.SetType(DayType.empty)
    }
    SetShift(start: number, duration: number) {
        this.type = DayType.shift;
        this.start = start;
        this.duration = duration;
    }
    SetType(type: DayType) {
        if (type != DayType.shift) {
            this.start = 0;
            this.duration = 0;
        }
        this.type = type
    }
}

