import { Sheet, ScheduleRow, ScheduleDay } from "@/model/schedule-sheet"
import { DayType, DayTypeDescription, DayTypeDescriptions } from "@/model/day-types"

export interface Aggregate {
    label: string,
    header_color: string,
    evaluate: (row: ScheduleDay[]) => number
}

// export interface Aggregate {
//     label: string,
//     evaluate: (row: ScheduleRow) => number
// }

// class TypeAccumulator implements Aggregate {
//     label: string
//     type: DayType
//     constructor(type: DayType, label: string = DayTypeDescriptions[type].label) {
//         this.label = label
//         console.log(label)
//         this.type = type
//     }
//     evaluate(row: ScheduleRow): number {
//         // return row.days.filter(d => this.types.some((t) => t == d.type)).length
//         return row.days.filter(d => d.type == this.type).length
//     }

// }
export class DayTypeCounter implements Aggregate {
    label: string
    types: DayType[]
    header_color: string
    desc: DayTypeDescription
    constructor(types: DayType | DayType[], label: string = '', header_color: string = '') {
        this.types = ([] as DayType[]).concat(types)
        this.desc = DayTypeDescriptions[this.types[0]]
        this.label = label || this.desc.label
        this.header_color = header_color || this.desc.color
    }
    evaluate(row: ScheduleDay[]): number {
        // console.log("eval")
        return row.filter(d => this.types.some((t) => t == d.type)).length
        // return row.filter(d => d.type == this.type).length
    }

}

export class TotalHours implements Aggregate {
    label: string
    header_color: string
    desc = DayTypeDescriptions[DayType.shift]
    constructor(label: string = '', header_color: string = '') {
        this.label = label || this.desc.label
        this.header_color = header_color || this.desc.color
    }
    evaluate(row: ScheduleDay[]): number {
        return row.reduce((acc, d) => { return acc + d.duration }, 0)
    }

}

interface RowAssertion {
    label: string,
    assert: (row: ScheduleRow) => boolean
}

interface GlobalAssertion {
    label: string,
    assert: (sheet: Sheet) => boolean
}

export const accumulators: Array<Aggregate> = [
    new TotalHours("Össz. óra", "#FFFFFF"),
    ...[DayType.paid, DayType.sick, [DayType.unpaid, DayType.weekend]].map(t => new DayTypeCounter(t)),
]

export const assertions = [

]

export const global_assertions = [

]