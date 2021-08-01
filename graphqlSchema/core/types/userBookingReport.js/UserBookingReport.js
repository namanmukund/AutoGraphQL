const UserBookingReport = `
  type UserBookingReport @model {
    registeredToday: Int
    bookedToday: Int
    demoCompletedToday: Int
    convertedUsersToday: Int
    phoneVerfiedToday: Int
    bookedbySelf: Int
    bookedByAgent: Int
    registeredTodayMinusOne: Int
    registerYesterdaybookedToday: Int
    registerYesterdaydemoComplete: Int
    registerYesterdayconvertedUsers: Int
    phoneVerfiedToday: Int
    bookedbySelf: Int
    bookedByAgent: Int
    registerYesterday: Int
    registerYesterdaybookedToday: Int
    registerYesterdaydemoComplete: Int
    registerYesterdayconvertedUsers: Int
    phoneVerfiedToday: Int
    bookedbySelf: Int
    bookedByAgent: Int
    registerYesterday: Int
    registerYesterdaybookedToday: Int
    registerYesterdaydemoComplete: Int
    registerYesterdayconvertedUsers: Int
    phoneVerfiedToday: Int
    bookedbySelf: Int
    bookedByAgent: Int
    totalBooked: Int
    totalDemoComplete: Int
    totalConvertedUsers: Int
    coutry: Country @defaultValue(value: "india")
    date: Date
  }
`;

export default [UserBookingReport];