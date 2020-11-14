const SalesOperationReport = `
  type SalesOperationReport {
    _id: String
    date: Date
    userRegisteredCount: Int
    menteeAllSessionsBookedCount: Int
    menteeFirstSessionBookedCount: Int
    firstSessionAllottedCount: Int
    firstSessionStartedCount: Int
    firstSessionCompletedCount: Int
    firstMentorMenteeSessionsCount: Int
    firstUnAssignedSessions: Int
    firstCompletedSessionsPercentage: Float
    secondSessionCompletedCount: Int
    allSessionsStartedCount: Int
    allSessionsCompletedCount: Int
    zoomIssue: Int
    internetIssue: Int
    laptopIssue: Int
    chromeIssue: Int
    powerCut: Int
    notResponseAndDidNotTurnUp: Int
    turnedUpButLeftAbruptly: Int
    leadNotVerifiedProperly: Int
    otherReasonForReschedule: Int
 }`;

export default SalesOperationReport;
