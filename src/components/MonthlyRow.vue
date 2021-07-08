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
  computed: {
      days_react() {
          return this.days 
      }
  },
});
</script>

<template>
  <tr>
    <td class="fixed-column">{{ employee_name }}</td>
    <schedule-day v-for="data, index in days_react" :key="index + data.type" :day="index + 1" :type="data.type" :test="data"/>
  </tr>
</template>

<style scoped>
tr{
    width: 100%;
}
#first{
    position: sticky;
    background-color: red;
}
</style>