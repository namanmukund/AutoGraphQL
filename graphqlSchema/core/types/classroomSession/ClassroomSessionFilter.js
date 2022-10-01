const ClassroomSessionFilter = `
  input ClassroomSessionFilter {
    # User IDs
    userIds: [String]

    # Filter By Schools
    schools: [ID]

    # Is Admin
    isAdmin: Boolean @defaultValue(value: "false")

    # Document Type*
    documentType: SessionDocumentType @defaultValue(value: "classroom")

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
    sessionStatus: [ClassroomSessionStatus]
  }
`;

export default [ClassroomSessionFilter];
