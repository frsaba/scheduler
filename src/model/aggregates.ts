import { Sheet, ScheduleRow, ScheduleDay } from "@/model/schedule-sheet"
import { DayType, DayTypeDescriptions } from "@/model/day-types"

export interface Aggregate {
    label: string,
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
    constructor(types: DayType[], label: string = DayTypeDescriptions[types[0]].label) {
        this.label = label
        this.types = types
    }
    evaluate(row: ScheduleDay[]): number {
        // console.log("eval")
        return row.filter(d => this.types.some((t) => t == d.type)).length
        // return row.filter(d => d.type == this.type).length
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
    ...[DayType.paid, DayType.sick, DayType.holiday, [DayType.unpaid, DayType.weekend]]
    .map(t => new DayTypeCounter(([] as DayType[]).concat(t)))
]

export const assertions = [

]

export const global_assertions = [

]