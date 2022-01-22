const UpdateParentChildDetailInput = `
  input UpdateParentChildDetailInput {
    parentName: String
    childName: String
    parentEmail: String
    parentPhone: PhoneInput 
    grade: Grade
    country: Country
    city: String
    timezone: String
    section: Section
    hasLaptopOrDesktop: Boolean
    referralCode: String
    schoolName: String
    browser: String
    browserVersion: String
    deviceType: String
    deviceOs: String
    osVersion: String
  }
`;

export default UpdateParentChildDetailInput;
