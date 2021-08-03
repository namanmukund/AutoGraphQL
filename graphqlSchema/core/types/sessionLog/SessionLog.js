import { TBA, TMS } from '../../../../constants';
import getSlotTimeFields from '../../functions/getSlotTimeFields';

const slotTimeFields = getSlotTimeFields('Boolean', false);

const sendTransactionalMessageFields = `
    sendSessionLink: Boolean
    didNotPickTheCall: Boolean
    sessionNotConducted: Boolean
    didNotTurnUpInSession: Boolean
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

const SessionLog = `
  type SessionLog @model
  @appPermissions(
    permissions:[
      { appName: "${TBA}" operations: "*" },
      { appName: "${TMS}" operations: "*" }
      ],
    rule: allow
  )
  {
    client: User @relation(name: "SessionLogsClientUser", direction: "OneWay")
    course: Course @relation(name: "SessionLogsCourse", direction: "OneWay")
    topic: Topic! @relation(name: "SessionLogsTopic", direction: "OneWay")
    action: SessionLogAction!
    actionBy: User! @relation(name: "SessionLogsActionByUser", direction: "OneWay")
    sessionDate: Date
    ${slotTimeFields}
    sessionStatus: SessionStatus
    mentor: User @relation(name: "SessionLogsMentorUser", direction: "OneWay")
    mentorAvailabilityDate: Date
    batchCode: String
    sessionStartDate: Date
    sessionEndDate: Date
    classMissedMessageStatus: ClassMissedMessageStatus @defaultValue(value: "pending")
    friendly: Boolean
    motivating: Boolean
    engaging: Boolean
    helping: Boolean
    enthusiastic: Boolean
    patient: Boolean
    conceptsPerfectlyExplained: Boolean
    distracted: Boolean
    rude: Boolean
    slowPaced: Boolean
    fastPaced: Boolean
    notPunctual: Boolean
    average: Boolean
    boring: Boolean
    poorExplanation: Boolean
    averageExplanation: Boolean
    comment: String
    rating: Int @length(min: 1, max: 5) @groupBy
    sessionRecordingLink: String
    ${sendTransactionalMessageFields} 
    ${sessionRescheduledReasons}
    isFeedbackSubmitted: Boolean @defaultValue(value: "false")
    sessionCommentByMentor: String
    source: UserOriginSource @defaultValue(value: "website")
    country: Country @defaultValue(value: "india")
    leadStatus: LeadStatus @groupBy
  }
`;

export default [SessionLog];
