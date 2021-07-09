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
  },
  computed: {
    display_text(): string {
      if (this.type == DayType.shift) {
        return `${this.start} - ${(this.duration + this.start) % 24}`;
      } else {
        return "*";
      }
    },
  },
});
</script>

<template>
  <td>
    <div>{{ display_text }}</div>
  </td>
</template>

<style scoped>
td:hover {
  background-color: #ccc;
  cursor: pointer;
}
td {
  border: 1px solid #ccc;
  text-align: center;
}
div{
  width: 2.5em;
}
</style>