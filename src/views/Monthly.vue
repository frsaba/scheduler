<script lang="ts">
import Vue from "vue";
import { Sheet } from "@/schedule-sheet";
import MonthlyRow from "@/components/MonthlyRow.vue";
export default Vue.extend({
  name: "Monthly",
  components: {
    MonthlyRow,
  },
  data() {
    return {
      x : 0,
      sheet: new Sheet(2021, 2),
    };
  },
  mounted() {
    this.sheet.AddRow("Példa János");
    this.sheet.GetRow("Példa János").SetShift(2,10,8)
    console.log(this.sheet)
  },
});
</script>

<template>
<div>
  <v-simple-table fixed-header class="table">
    <thead>
      <tr>
        <th class="text-center fixed-column">Név</th>
        <th class="text-center" v-for="n in sheet.month_length" :key="n">
          {{ n }}
        </th>
      </tr>
    </thead>
    <tbody>
      <monthly-row
        v-for="row in this.sheet.schedule"
        :key="row.employee_name"
        :employee_name="row.employee_name"
        :days="row.days"
      />
    </tbody>
  </v-simple-table>
</div>
</template>

<style>
/* .fixed-column{
  position: absolute !important; 
  width: 8em;
  margin-left: -8em;
  background-color  : rgb(8, 228, 27);
} */
/* .table{
  margin-left: 8em;
} */

</style>