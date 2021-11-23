const ResetPasswordAndLoginInput = `
  input ResetPasswordAndLoginInput {
    userToken: String
    linkToken: String
    username: String
    email: String
    phone: PhoneInput
    password : String!
    confirmPassword: String!
  }`;

export default [ResetPasswordAndLoginInput];
