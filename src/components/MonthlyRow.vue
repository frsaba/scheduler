<script lang="ts">
import Vue from "vue";
import ScheduleDay from "@/components/ScheduleDay.vue";
export default Vue.extend({
  name: "Monthlyrow",
  components: {
    ScheduleDay,
  },
  props: {
    employee_name: String,
    days: Array,
  },
});
</script>

<template>
  <tr>
    <th>{{ employee_name }}</th>
    <schedule-day
      v-for="(data, index) in days"
      :key="index"
      :day="index + 1"
      :type="data.type"
      :duration="data.duration"
      :start="data.start"
    />
  </tr>
</template>

<style scoped>
</style>