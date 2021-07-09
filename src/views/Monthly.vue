<script lang="ts">
import Vue from "vue";
import { DayType, Sheet } from "@/schedule-sheet";
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
    shift(name:string, day: number) {
      let row = this.sheet.GetRow(name);
      if(row.GetDay(day).type == DayType.empty){
        row.SetShift(day, 10, 8);
      }else{
        row.DeleteShift(day)
      }
    },
  },
});
</script>

<template>
  <div class="wrapper">
    <v-btn color="success" @click="add">Új dolgozó</v-btn>
    <v-btn color="success" @click="shift">Shift</v-btn>
    <div class="table-wrapper">
      <table fixed-header class="table">
        <thead>
          <tr>
            <th class="text-center"> <div class="nametag">Név</div></th>
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
            @day-click="shift(row.employee_name, $event)"
          />
        </tbody>
      </table>
    </div>
  </div>
</template>

<style>
.wrapper {
  max-height: 100%;
}
.nametag{
  width: 8em;
}

.table-wrapper {
  overflow: scroll;
  position: relative;
  border: 1px solid #eee;
  max-height: 75vh;
}
table {
  position: relative;
  border-collapse:unset;
  table-layout: fixed;
  user-select: none;
}

td,
th {
  padding: 0.5em;
}

thead th {
  position: sticky;
  top: 0;
  background: #000;
  color: #fff;
}

thead th:first-child {
  left: 0;
  z-index: 1;
}

tbody th {
  position: sticky;
  left: 0;
  background: #fff;
  border: 1px solid #ccc;
}
</style>