const SignupOrLoginUserInput = `
  input SignupOrLoginUserInput {
    email: String
    phone: PhoneInput
    username: String
    campaignId: String
    utmSource: String
    utmCampaign: String
    utmTerm: String
    name: String
    utmContent: String
    utmMedium: String
    source: UserOriginSource
    country: String
    city: String
    timezone: String
    role: UserRole @defaultValue(value: "parent")
    eventId: String
    shouldAddInWaitingList: Boolean @defaultValue(value: "false")
  }`;

export default SignupOrLoginUserInput;
