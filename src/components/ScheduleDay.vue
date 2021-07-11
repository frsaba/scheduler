<script lang="ts">
import Vue from "vue";
import { DayType } from "@/schedule-sheet";
export default Vue.extend({
    name: "Day",
    props: {
        day: Number,
        test: Object,
        type: Number,
        start: Number,
        duration: Number,
        selected: {
            default: true
        }
    },
    computed: {
        display_text(): string {
            if (this.type == DayType.shift) {
                return `${this.start} - ${(this.duration + this.start) % 24}`;
            } else {
                return "-";
            }
        },
        style(){
            if(this.selected){
                return "selected"
            }else{
                return ""
            }
        }
    },
});
</script>

<template>
    <td :class="style">
        {{ display_text }}
    </td>
</template>

<style scoped>
td:hover {
    background-color: #ddd;
    cursor: pointer;
}
td {
    border: 0.5px solid #ccc;
    text-align: center;
    min-width: 4em;
}
.selected {
    border: 0.5px solid #1f1f1f;
    background-color: #ccc;
    text-align: center;
    min-width: 4em;
}
</style>