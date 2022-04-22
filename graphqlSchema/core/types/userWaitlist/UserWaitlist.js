const UserWaitlist = `
  type UserWaitlist @model 
  {
    name: String
    email: String @uniqueOrEmpty @trim
    phone: Phone @uniqueOrEmpty
    role: UserRole! @defaultValue(value: "parent")
    studentName: String
    grade: Grade
    section: Section
  }
`;
export default [UserWaitlist];
