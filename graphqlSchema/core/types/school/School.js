const School = `
  type School @model {
    name: String! @unique
    code: String! @unique @trim
    admins: [User] @relation(name:"UserSchool")
    classes: [SchoolClass] @relation(name: "SchoolClassSchool")
    students: [StudentProfile] @relation(name: "StudentProfileSchool")
    coordinatorEmail: String @uniqueOrEmpty @trim
    coordinatorPhone: Phone @uniqueOrEmpty
    coordinatorRole: SchoolCoordinatorRole
    coordinatorName: String
    city: String
    country: Country @defaultValue(value: "india")
    products: [Product] @relation(name: "SchoolProduct")
    logo: File @relation(name: "SchoolLogo", direction: "OneWay")
  }
`;
export default [School];
