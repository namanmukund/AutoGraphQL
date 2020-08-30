const SalesOperationReport = `
  type SalesOperationReport {
    _id: String
    date: Date
    userRegisteredCount: Int
    menteeAllSessionsBookedCount: Int
    menteeFirstSessionBookedCount: Int
    firstSessionStartedCount: Int
    firstSessionCompletedCount: Int
    secondSessionCompletedCount: Int
    allSessionsStartedCount: Int
    allSessionsCompletedCount: Int
 }`;

export default SalesOperationReport;
