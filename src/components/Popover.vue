<script lang="ts">
import Vue from "vue";
import { DayType, DayTypeDescriptions } from "@/model/day-types";
import LeaveButton from "@/components/LeaveButton.vue";

interface LeaveButtonData {
	type: string,
	color: string,
	tooltip: string,
	label: string
}

export default Vue.extend({
	name: "Popover",
	components: {
		LeaveButton,
	},
	props: {
		value: {
			type: Boolean,
			default: false,
		},
		selected_start: DOMRect,
		selected_end: DOMRect,
	},
	data() {
		return {
			shift_start: 8,
			shift_end: 16,
			shift_duration: 8,
			last_width: 500,
			leave_buttons: [DayType.paid, DayType.unpaid, DayType.weekend, DayType.sick, DayType.holiday] as DayType[]
		};
	},
	computed: {
		x(): number {
			return (this.selected_start.x + (this.selected_end.x + this.selected_end.width - this.selected_start.x - this.width()) / 2);
		},
		y(): number {
			return this.selected_start.y + this.selected_start.height + 5;
		},
		desc() {
			return DayTypeDescriptions
		}
	},
	created() {
		window.addEventListener("keyup", this.escToClose);
	},
	destroyed() {
		window.removeEventListener("keyup", this.escToClose);
	},
	methods: {
		close() {
			this.$emit("close");
		},
		escToClose(e: KeyboardEvent) {
			if (e.key == "Escape") {
				this.close();
			}
		},
		//if user changes the start, keep duration the same and set shift_end accordingly
		inputStart() {
			this.shift_start = Math.abs(this.shift_start + 24) % 24;
			this.shift_end = (this.shift_duration + this.shift_start) % 24;
			this.setShift();
		},
		//if user changes end, decrease duration and keep shift_start the same
		inputEnd() {
			this.shift_end = Math.abs(this.shift_end + 24) % 24;
			this.shift_duration = (this.shift_start < this.shift_end ? 0 : 24) + this.shift_end - this.shift_start;
			this.setShift()
		},
		setShift() {
			this.$emit('set-shift', { start: this.shift_start, duration: this.shift_duration })
		},
		setType(type: DayType) {
			this.$emit('set-type', type)
		},
		card_rect_width(): number {
			let element = this.$refs.card as Vue
			if (element) {
				return element.$el.getBoundingClientRect().width;
			}
			return 0;
		},
		width(): number {
			if (this.card_rect_width() != 0) {
				this.last_width = this.card_rect_width();
			}
			return this.last_width
		}
	},
});
</script>

<template>
	<v-menu
		:value="value"
		:close-on-content-click="false"
		:close-on-click="false"
		disable-keys
		:position-x="x"
		:position-y="y"
		absolute>
		<v-card class="card" ref="card">
			<div class="upper">
				<v-text-field
					solo
					label="label"
					type="number"
					hide-details="true"
					v-model.number="shift_start"
					@input="inputStart"></v-text-field>
				<span>-</span>
				<v-text-field
					solo
					label="label"
					type="number"
					hide-details="true"
					v-model.number="shift_end"
					@input="inputEnd"></v-text-field>

				<leave-button :type="0" @set-type="setShift" tooltip="Műszak" :dark="false">
					<v-icon>mdi-set-split</v-icon>
				</leave-button>
				<leave-button :type="7" @set-type="setType" tooltip="Törlés" color="red">
					<v-icon>mdi-delete</v-icon>
				</leave-button>
				<v-btn class="absolute" fab @click="close" x-small elevation="0">
					<v-icon>mdi-close</v-icon>
				</v-btn>
			</div>
			<div class="lower">
				<leave-button v-for="b in leave_buttons" :key="b" :type="b" @set-type="setType"/>
				
			</div>
		</v-card>
	</v-menu>
</template>

<style scoped>
/* .card {
	border: 1px solid grey;
} */
.v-text-field {
	width: 4em;
}
.upper,
.lower {
	margin: 1em;
	display: flex;
	align-items: center;
	gap: 10px;
	justify-content: space-between;
	flex-wrap: wrap;
}

/* .absolute {
	position: absolute;
} */
</style>