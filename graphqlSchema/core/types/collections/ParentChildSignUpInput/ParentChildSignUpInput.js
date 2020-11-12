const ParentChildSignUpInput = `
  input ParentChildSignUpInput {
    parentName: String!
    childName: String!
    parentEmail: String!
    parentPhone: PhoneInput!  
    grade: Grade
    section:  String
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
  }
`;

export default ParentChildSignUpInput;
