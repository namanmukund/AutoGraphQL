const School = `
  type School @model {
    name: String @unique
    classes: [Class]
    students: [StudentProfile] @relation(name: "StudentProfileSchool")
    coordinator: SchoolCoordinator
    city: String
    country: Country @defaultValue(value: "india")
    products: [Product] @relation(name: "SchoolProduct")
  }
`;
export default [School];
