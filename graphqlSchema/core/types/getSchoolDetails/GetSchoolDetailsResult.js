const GetSchoolDetailsResult = `
  type GetSchoolDetailsResult {
    id: String
    name: String
    code: String
    coordinatorEmail: String
    coordinatorPhone: Phone
    coordinatorRole: SchoolCoordinatorRole
    coordinatorName: String
    city: String
    country: Country
    logo: File @relation(name: "GetSchoolDetailsResultFile", direction: "OneWay")
    bgImage: File @relation(name: "GetSchoolDetailsResultPictureFile", direction: "OneWay")
    batchId: String
  }
`;

export default [GetSchoolDetailsResult];
