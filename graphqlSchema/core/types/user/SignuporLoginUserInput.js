const SignupOrLoginUserInput = `
  input SignupOrLoginUserInput {
    email: String
    phone: PhoneInput
    campaignCode: String
    utmSource: String
    utmCampaign: String
    utmTerm: String
    utmContent: String
    utmMedium: String
    country: String
    timezone: String
  }`;

export default SignupOrLoginUserInput;
