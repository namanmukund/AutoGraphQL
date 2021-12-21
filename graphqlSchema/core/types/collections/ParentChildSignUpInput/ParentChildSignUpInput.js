const ParentChildSignUpInput = `
  input ParentChildSignUpInput {
    parentName: String!
    childName: String!
    parentEmail: String
    parentPhone: PhoneInput
    parentPassword: String
    childPassword: String
    childEmail: String 
    grade: Grade
    country: Country
    city: String
    timezone: String
    section: Section @groupBy
    rollNo: String
    batch: String
    branch: String
    hasLaptopOrDesktop: Boolean
    referralCode: String
    schoolName: String
    isBuyNow: Boolean
    utmSource: String
    utmCampaign: String
    utmTerm: String
    utmContent: String
    utmMedium: String
  }
`;

export default ParentChildSignUpInput;
