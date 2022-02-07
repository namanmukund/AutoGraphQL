const ClassroomSessionFilter = `
  input ClassroomSessionFilter {
    userId: String!
    startDate: Date!
    endDate: Date!
    grades: [Grade]
    sections: [Section]
    courses: [ID]
    SessionStatus: [SessionStatus]
  }
`;

export default [ClassroomSessionFilter];
