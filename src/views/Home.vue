<template>
  <hello-world />
</template>

<script lang="ts">
import Vue from "vue";
import HelloWorld from "../components/HelloWorld.vue";
import { ipcRenderer } from "electron";

export default Vue.extend({
  name: "Home",

  components: {
    HelloWorld,
  },
  mounted() {
    ipcRenderer.on("hi", (event) => {
      console.log("hali");
    });

    // io.ReadFile();
  },
});
</script>
