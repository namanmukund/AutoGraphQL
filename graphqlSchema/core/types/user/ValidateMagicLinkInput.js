const ValidateMagicLinkInput = `
  input ValidateMagicLinkInput {
    linkToken: String
    loginViaOtp: Boolean @defaultValue(value: "false")
  }`;

export default ValidateMagicLinkInput;
