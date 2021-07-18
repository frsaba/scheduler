import { Sheet, ScheduleRow, ScheduleDay } from "@/model/schedule-sheet"
import { DayType, DayTypeDescription, DayTypeDescriptions } from "@/model/day-types"

export interface Aggregate {
    label: string,
    header_color: string,
    background_color: string,
    evaluate: (row: ScheduleDay[]) => number | boolean
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
    types: DayType[]
    desc: DayTypeDescription
    constructor(
        types: DayType | DayType[], 
        public label: string = '', 
        public header_color: string = '', 
        public background_color: string = ''
    ) {
        this.types = ([] as DayType[]).concat(types)
        this.desc = DayTypeDescriptions[this.types[0]]
        this.background_color = background_color || `var(--v-${this.desc.type}-lighten5)`
        console.log(this.background_color);
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
    desc = DayTypeDescriptions[DayType.shift]
    constructor(
        public label: string,
        public header_color: string,
        public background_color: string,
    ) { }
    evaluate(row: ScheduleDay[]): number {
        return row.reduce((acc, d) => {
            if (d.type === DayType.shift)
                return acc + d.duration;
            if (d.type === DayType.paid || d.type === DayType.sick)
                return acc + 8;

            return acc;
        }, 0)
    }
}

export class ShiftVariety implements Aggregate {
    static differencePercentage: number = 33;
    constructor(
        public label: string,
        public header_color: string,
        public background_color: string,
    ) {
    }
    evaluate(row: ScheduleDay[]): boolean {
        let [normalShiftCount, differentShiftCount] = row.reduce((acc, curr) => {
            if (curr.start === 7) acc[0]++;
            else if (curr.type === DayType.shift) acc[1]++;

            return acc;
        }, [0, 0]);
        console.log(normalShiftCount, differentShiftCount);

        return differentShiftCount / normalShiftCount * 100 > ShiftVariety.differencePercentage;
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
    new TotalHours("Össz. óra", "#FFFFFF", "#FFFFFF"),
    ...[DayType.paid, DayType.sick, [DayType.unpaid, DayType.weekend]].map(t => new DayTypeCounter(t)),
    new ShiftVariety("33%", "#FFFFFF", "#FFFFFF")
]

export const assertions = [

]

export const global_assertions = [

]