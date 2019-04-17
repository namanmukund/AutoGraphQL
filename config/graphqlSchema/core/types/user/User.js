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
  }
`;

export default [User];
