const School = `
  type School @model {
    name: String @unique
    classes: [Class]
    students: [StudentProfile] @relation(name: "StudentProfileSchool")
  }
`;
export default [School];
