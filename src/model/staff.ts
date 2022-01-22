export class Staff {
	employees: Employee[] = []
	tags: string[] = []
	Add(name: string, tags: string[] = []) {
		if (this.employees.some(e => e.name == name)) throw `Már létezik '${name}' dolgozó!`

		let employee = new Employee(name, this.employees.length, tags)
		this.employees.push(employee)
		return employee
	}
	Remove(name: string) {
		this.employees = this.employees.filter(x => x.name !== name)
		
		this.tags = this.tags.filter(tag => this.employees.find(e => e.tags.includes(tag)))
	}
	Rename(newName: string, oldName: string) {
		let i = this.employees.findIndex(e => e.name == oldName)
		this.employees[i].name = newName
	}
	AddTag(name: string, tag: string) {
		if (!this.tags.includes(tag)) this.tags.push(tag)
		this.GetEmployee(name).tags.push(tag)
	}
	RemoveTag(name: string, tag: string) {
		let employee = this.GetEmployee(name);
		employee.tags = employee.tags.filter(t => t !== tag)
		if (!this.employees.find((x) => x.tags.includes(tag)))
			this.tags = this.tags.filter(t => t !== tag)
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

let staff = new Staff()

export default staff