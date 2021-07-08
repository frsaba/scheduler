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
      x: 1,
      sheet: new Sheet(2021, 2),
    };
  },
  mounted() {
    this.sheet.AddRow("Példa János");
    this.sheet.GetRow("Példa János").GetDay(2).SetShift(19, 8);
  },
  methods: {
    add() {
      this.sheet.AddRow("Példa János" + this.x);
      this.x++;
    },
    shift() {
      this.sheet.GetRow("Példa János").SetShift(this.x, 19, 12);
      this.x++;
      console.log(this.sheet);
    },
  },
});
</script>

<template>
  <div>
    <table fixed-header class="table">
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
    </table>
    <v-btn color="success" @click="add">Új dolgozó</v-btn>
    <v-btn color="success" @click="shift">Shift</v-btn>
  </div>
</template>

<style>
.fixed-column {
  position: absolute !important;
  width: 8em;
  margin-left: -8em;
}
.table {
  margin-left: 8em;
  border: 1px solid black;
  table-layout: fixed; 
  width: 100%;
  overflow: auto;
}
th {
  width: 8em
}
</style>