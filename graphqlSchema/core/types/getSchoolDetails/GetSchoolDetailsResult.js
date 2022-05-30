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
    isTeachersAppEnabled: Boolean @defaultValue(value: "false")
    logo: File @relation(name: "GetSchoolDetailsResultFile", direction: "OneWay")
    bgImage: File @relation(name: "GetSchoolDetailsResultPictureFile", direction: "OneWay")
    batchId: String
    isOtpLoginEnabled: Boolean @defaultValue(value: "false")
    isBuddyLoginEnabled: Boolean @defaultValue(value: "false")
    buddyLoginLimit: Int
  }
`;

export default [GetSchoolDetailsResult];
