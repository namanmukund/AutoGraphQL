const User = `
  type User @model {
    phoneOtp: Int @writeOnly
    emailOtp: Int @writeOnly
    name: String! @trim
    status: Status! @defaultValue(value: "inactive") @readOnly
    username: String! @unique @auto
    password: String @filterOff
    email: String @uniqueOrNull @trim
    emailVerified: Boolean @defaultValue(value: "false") @readOnly
    phone: Phone @uniqueOrNull
    phoneVerified: Boolean @defaultValue(value: "false")
    dateOfBirth: Date
    gender: Gender
    isSetPassword: Boolean @defaultValue(value: "false")
  }
`;

export default [User];
