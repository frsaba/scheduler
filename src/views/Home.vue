<template>
</template>

<script lang="ts">
import Vue from "vue";
import { ipcRenderer } from "electron";

export default Vue.extend({
  name: "Home",

  components: {
  },
  mounted() {
    ipcRenderer.on("hi", (event) => {
      console.log("hali");
    });

    // io.ReadFile();
  },
});
</script>
