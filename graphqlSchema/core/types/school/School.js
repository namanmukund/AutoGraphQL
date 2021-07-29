const School = `
  type School @model {
    name: String! @unique
    code: String @unique @trim
    admins: [User] @relation(name:"UserSchool")
    enrollmentType: EnrollmentType! @defaultValue(value: "free")
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
    schoolPicture: File @relation(name: "SchoolPicture", direction: "OneWay")
    hubspotId: String
  }
`;
export default [School];
