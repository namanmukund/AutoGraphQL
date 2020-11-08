const ParentChildSignUpInput = `
  input ParentChildSignUpInput {
    parentName: String!
    childName: String!
    parentEmail: String!
    parentPhone: PhoneInput!  
    grade: Grade
    hasLaptopOrDesktop: Boolean
    referralCode: String
    schoolName: String
    isBuyNow: Boolean
  }
`;

export default ParentChildSignUpInput;
