const MentorReport = `
  type MentorReport @model {
    mentor: User! @relation(name: "MentorReportUser", direction: "OneWay")
    reportDate: Date
    slotsOpened: Int
    bookingsAssigned: Int
    bookingsRescheduled: Int
    formFilled: Int
    sessionLinkUploaded: Int
    trialsCompleted: Int
    unfit: Int
    lost: Int
    cold: Int
    pipeline: Int
    hot: Int
    won: Int
    oneToOneConversion: Int
    oneToTwoConversion: Int
    oneToThreeConversion: Int
    pythonCourseRating5: Int
    pythonCourseRating4: Int
    pythonCourseRating3: Int
    pythonCourseRating2: Int
    pythonCourseRating1: Int
}`;

export default [MentorReport];
