export class Staff {
    employees: Array<Employee> = new Array()
    Add(name: string) {
        this.employees.push(new Employee(name, this.employees.length))
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
    ) { }
}

let staff = new Staff()

export default staff