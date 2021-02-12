const School = `
  type School @model {
    name: String @unique
    classes: [Class]
    students: [StudentProfile] @relation(name: "StudentProfileSchool")
    coordinator: SchoolCoordinator @relation(name: "SchoolCoordinatorSchool")
    city: String
    country: Country @defaultValue(value: "india")
  }
`;
export default [School];
