<script lang="ts">
import { defineComponent } from '@vue/composition-api'

export default defineComponent({
	name: "Button",
	props: {
		icon: String,
        tooltip: String
	},
	setup() {

	},
})
</script>

<template>
    <v-tooltip bottom>
		<template v-slot:activator="{ on, attrs }">
            <v-btn v-bind="[attrs, $attrs]" v-on="{...on, ...$listeners}">
                <v-icon> {{icon}}</v-icon>
				<slot></slot>
			</v-btn>
		</template>
		<span>{{tooltip}}</span>
	</v-tooltip>
</template>