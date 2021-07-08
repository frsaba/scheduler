<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
    name: "Day",
    props: {
        day: Number,
        type: String,
        test: Object
    },
    computed: {
        display_text() {
            if(this.type == "shift"){
                return "shift"
            }else{
                return "*"
            }
        }
    },
})
</script>

<template>
    <td>
        {{display_text}}
    </td>
</template>

<style scoped>
/* td{
    padding: 10px;
} */
</style>