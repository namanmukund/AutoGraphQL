const WaitingList = `
  type WaitingList @model 
  {
    name: String
    email: String @uniqueOrEmpty @trim
    phone: Phone @uniqueOrEmpty
    role: UserRole! @defaultValue(value: "parent")
  }
`;
export default [WaitingList];
