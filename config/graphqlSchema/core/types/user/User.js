const User = `
  type User @model {
    phoneOtp: Int @writeOnly
    emailOtp: Int @writeOnly
    name: String @trim
    status: Status! @defaultValue(value: "active") @readOnly
    username: String! @unique @auto
    password: String @filterOff @writeOnly
    email: String! @uniqueOrEmpty @trim
    emailVerified: Boolean @defaultValue(value: "true") @readOnly
    phone: Phone @uniqueOrEmpty
    phoneVerified: Boolean @defaultValue(value: "false")
    dateOfBirth: Date
    gender: Gender
    isSetPassword: Boolean @defaultValue(value: "false")
    socialProfilePic: String
    gmailAzp: String @writeOnly
    gmailAud: String @writeOnly
    gmailSub: String @writeOnly
    gmailLocale: String @writeOnly
    isGmailLogin: Boolean @defaultValue(value: "false") @writeOnly
    isFacebookLogin: Boolean @defaultValue(value: "false") @writeOnly
    facebookId: String @writeOnly
  }
`;

export default [User];
