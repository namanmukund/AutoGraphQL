const School = `
  type School @model {
    name: String @unique
    admin: User @relation(name:"UserSchool")
    classes: [Class]
    students: [StudentProfile] @relation(name: "StudentProfileSchool")
    coordinatorEmail: String @uniqueOrEmpty @trim
    coordinatorPhone: Phone @uniqueOrEmpty
    coordinatorRole: SchoolCoordinatorRole
    coordinatorName: String
    city: String
    country: Country @defaultValue(value: "india")
    products: [Product] @relation(name: "SchoolProduct")
  }
`;
export default [School];
