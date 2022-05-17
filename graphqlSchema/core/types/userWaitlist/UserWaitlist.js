const UserWaitlist = `
  type UserWaitlist @model 
  {
    name: String
    email: String @trim
    phone: Phone
    role: UserRole! @defaultValue(value: "parent")
    studentName: String
    grade: Grade
    section: Section
  }
`;
export default [UserWaitlist];
