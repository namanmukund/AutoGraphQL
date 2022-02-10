const ClassroomSessionFilter = `
  input ClassroomSessionFilter {
    # User ID*
    userId: String!

    # Starting Booking Date*  
    startDate: Date!

    # Ending Booking Date*
    endDate: Date!

    # Filter By Grades
    grades: [Grade]

    # Filter By Sections
    sections: [Section]

    # Filter By Courses
    courses: [ID]

    # Filter By Session Status
    sessionStatus: [SessionStatus]

    # Filter By Schools
    schools: [ID]
  }
`;

export default [ClassroomSessionFilter];
