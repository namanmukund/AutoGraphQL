const ParentChildSignUpInput = `
  input ParentChildSignUpInput {
    parentName: String!
    childName: String!
    parentEmail: String!
    parentPhone: PhoneInput!  
    grade: Grade
    hasLaptopOrDesktop: Boolean
    invitedByCode: String
  }
`;

export default ParentChildSignUpInput;
