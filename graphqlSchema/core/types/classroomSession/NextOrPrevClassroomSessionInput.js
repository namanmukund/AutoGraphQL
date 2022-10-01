const NextOrPrevSessionType = `
  enum NextOrPrevSessionType {
    next
    previous
  }
`;

const NextOrPrevClassroomSessionInput = `
  input NextOrPrevClassroomSessionInput {
    classroomId: ID!
    limit: Int!
    queryType: NextOrPrevSessionType!
    bookingDate: Date!
  }
`;

export default [NextOrPrevClassroomSessionInput, NextOrPrevSessionType];
