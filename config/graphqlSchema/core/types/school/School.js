const School = `
  type School @model {
    name: String @unique
    status: Status! @defaultValue(value: "inactive")
    classes: [Class]
    students: [StudentProfile] @relation(name: "StudentProfileSchool")
  }
`;
export default [School];
