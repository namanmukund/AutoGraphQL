const SessionBookedToday = `
  type SessionBookedToday {
    registered: Int
    bookedToday: Int
    demoCompleted: Int
    converted: Int
    phoneVerfied: Int
    bookedbySelf: Int
    bookedByAgent: Int
  }
`;

const SessionReport = `
  type SessionReport @model {
    registeredToday: SessionBookedToday
    registeredOneDayBefore: SessionBookedToday
    registeredTwoDaysBefore: SessionBookedToday
    registeredThreeDaysBefore: SessionBookedToday
    totalBookedToday: Int
    totalDemoCompleteToday: Int
    totalConvertedUsersToday: Int
    coutry: Country @defaultValue(value: "india")
    date: Date
  }
`;

export default [SessionReport, SessionBookedToday];