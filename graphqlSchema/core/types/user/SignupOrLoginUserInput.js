const SignupOrLoginUserInput = `
  input SignupOrLoginUserInput {
    email: String
    phone: PhoneInput
    campaignId: String
    utmSource: String
    utmCampaign: String
    utmTerm: String
    utmContent: String
    utmMedium: String
    source: UserOriginSource
    country: String
    timezone: String
    role: UserRole @defaultValue(value: "parent")
  }`;

export default SignupOrLoginUserInput;
