import { TBA, TMS } from '../../../../constants';
import { READ } from '../../../../constants/graphqlOperations';
import getPermissionSchemaString from '../../../../src/autoGenerate/utils/getPermissionSchemaString';

const SessionBookedToday = `
  type SessionBookedToday {
    registered: Int
    booked: Int
    demoCompleted: Int
    converted: Int
    phoneVerified: Int
    bookedBySelf: Int
    bookedByAgent: Int
  }
`;

const sessionRescheduledReasons = `
    hasRescheduled: Boolean
    rescheduledDate: Date
    rescheduledDateProvided: Boolean
    internetIssue: Boolean
    zoomIssue: Boolean
    laptopIssue: Boolean
    chromeIssue: Boolean
    powerCut: Boolean
    notResponseAndDidNotTurnUp: Boolean
    classDurationExceeded: Boolean
    turnedUpButLeftAbruptly: Boolean
    leadNotVerifiedProperly: Boolean
    otherReasonForReschedule: Boolean
    otherReasonForChallenges: String
    webSiteLoadingIssue: Boolean
    videoNotLoading: Boolean
    codePlaygroundIssue: Boolean
    logInOTPError: Boolean
    otherTechnicalReason: String
    languageBarrier: Languages
    otherLanguageBarrier: String
`;

const SessionReport = `
  type SessionReport @model 
  ${getPermissionSchemaString('SessionReport')}
  @appPermissions(
    permissions: [
    { appName: "${TBA}" operations: "*" },
    { appName: "${TMS}" operations: ${READ} }
  ],
    rule: allow
  )
  {
    registeredSameDay: SessionBookedToday
    registeredOneDayBefore: SessionBookedToday
    registeredTwoDaysBefore: SessionBookedToday
    registeredThreeDaysBefore: SessionBookedToday
    totalBooked: Int
    totalDemoCompleted: Int
    totalConvertedUsers: Int
    ${sessionRescheduledReasons}
    country: Country @defaultValue(value: "india")
    date: Date
  }
`;

export default [SessionReport, SessionBookedToday];
