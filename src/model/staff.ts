import { tagColors, tagFontColors } from "@/plugins/vuetify"

export class Staff {
	employees: Employee[] = []
	tags: Tag[] = []
	Add(name: string, tags: string[] = []) {
		if (this.employees.some(e => e.name == name)) throw `Már létezik '${name}' dolgozó!`

		let employee = new Employee(name, this.employees.length)
		this.employees.push(employee)
		for (const tag of tags)
			this.AddTag(name, tag)

		return employee
	}
	Remove(name: string) {
		for (const tag of this.GetEmployee(name).tags)
			this.RemoveTag(name, tag)

		this.employees = this.employees.filter(x => x.name !== name)
	}
	Rename(newName: string, oldName: string) {
		let i = this.employees.findIndex(e => e.name == oldName)
		this.employees[i].name = newName
	}
	AddTag(employeeName: string, tag: string) {
		if (!this.tags.some(x => x.name == tag)) {
			let color = tagColors[this.tags.length % tagColors.length];
			let fontColor = tagFontColors[this.tags.length % tagFontColors.length];
			this.tags.push({ name: tag, color, fontColor })
		}
		this.GetEmployee(employeeName).tags.push(tag)
	}
	RemoveTag(name: string, tag: string) {
		let employee = this.GetEmployee(name);
		employee.tags = employee.tags.filter(t => t !== tag)
		if (!this.employees.find((x) => x.tags.includes(tag))) {
			this.tags = this.tags.filter(t => t.name !== tag)
			this.tags = this.tags.map((tag, i) => ({
				name: tag.name,
				color: tagColors[i % tagColors.length],
				fontColor: tagFontColors[i % tagFontColors.length]
			}));
		}
	}
	private GetEmployeeID(name: string): number {
		let id = this.employees.findIndex(e => e.name == name);
		if (id == -1) throw new Error(`Nem létezik '${name}' nevű dolgozó!`);
		return id;
	}
	GetEmployee(employee: string | number) {
		let id = typeof employee == "number" ? employee : this.GetEmployeeID(employee);
		if (id < 0 || id >= this.employees.length) throw new Error(`Nem létezik ${id}. dolgozó!`);
		return this.employees[id]
	}
}

export class Employee {
	constructor(
		public name: string,
		public id: number,
		public tags: string[] = []
	) { }
}

export interface Tag {
	name: string, 
	color: string, 
	fontColor: string
}

let staff = new Staff()

export default staff