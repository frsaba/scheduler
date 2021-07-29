import { Sheet, ScheduleRow, ScheduleDay } from "@/model/schedule-sheet"
import { DayType, DayTypeDescription, DayTypeDescriptions } from "@/model/day-types"
import { Lighten } from "@/utils/color-helpers"

export interface Aggregate {
    label: string,
    header_color: string,
    background_color: string,
    evaluate: (row: ScheduleDay[]) => number | boolean
}

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
        this.background_color = background_color || Lighten(this.desc.color, 175)
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
            if ([DayType.paid, DayType.sick, DayType.holiday].some(x => x === d.type))
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
        // console.log(normalShiftCount, differentShiftCount);

        return differentShiftCount / normalShiftCount * 100 > ShiftVariety.differencePercentage;
    }
}

class SomeShortShifts implements Aggregate {
    desc = DayTypeDescriptions[DayType.shift]
    constructor(
        public label: string,
        public header_color: string,
        public background_color: string,
    ) { }
    evaluate(row: ScheduleDay[]): boolean {
        return row.filter(d => d.type == DayType.shift && d.duration <= 8).length > 1
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
    new ShiftVariety("33%", "#FFFFFF", "#FFFFFF"),
    new SomeShortShifts("2x8", "#FFFFFF", "#FFFFFF"),
    ...[DayType.paid, DayType.sick, [DayType.unpaid, DayType.weekend]].map(t => new DayTypeCounter(t)),
]

export const assertions = [

]

export const global_assertions = [

]

export class StartTimeCount {
    counts: number[];
    constructor(public hour: number, length: number) {
        this.counts = new Array(length).fill(0)
    }
}

export function CountStartingTimes(sheet: Sheet): Array<StartTimeCount> {
    let result = new Array<StartTimeCount>()

    sheet.schedule.forEach(row => {
        for (let i = 0; i < sheet.month_length; i++) {
            let day = row.GetDay(i + 1);

            if (day.type == DayType.shift) {
                let start = day.start;
                let counter_row = result.find(e => e.hour == start)

                if (!counter_row) {
                    counter_row = new StartTimeCount(start, sheet.month_length)
                    result.push(counter_row)
                }

                counter_row.counts[i] += 1
            }
        }
    })

    return result.sort((a, b) => a.hour - b.hour);
}