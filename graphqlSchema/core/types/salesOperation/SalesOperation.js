import { TMS } from '../../../../constants';
import { MENTOR, UMS_HEAD, UMS_VIEWER } from '../../../../constants/roles';

const unQualifiedLeadReasons = `
    knowCoding: Boolean
    lookingForAdvanceCourse: Boolean
    ageNotAppropriate: Boolean
    notRelevantDifferentStream: Boolean 
    noPayingPower: Boolean
    notInterestedInCoding: Boolean
    learningAptitudeIssue: Boolean
    notAQualifiedLeadComment: String
`;

const sessionRescheduledReasons = `
    hasRescheduled: Boolean
    internetIssue: Boolean
    zoomIssue: Boolean
    laptopIssue: Boolean
    chromeIssue: Boolean
    powerCut: Boolean
    notResponseAndDidNotTurnUp: Boolean
    turnedUpButLeftAbruptly: Boolean
    leadNotVerifiedProperly: Boolean
    otherReasonForReschedule: Boolean
`;

const mentorPitch = `
    pricingPitched: Boolean
    parentCounsellingDone: Boolean
    courseInterestedIn: ProductType
    leadStatus: LeadStatus
`;

const studentPersonna = `
    prodigyChild: Boolean
    extrovertStudent: YesNoAverage
    fastLearner: YesNoAverage
    studentEnglishSpeakingSkill: EnglishSpeakingSkill
    parentEnglishSpeakingSkill: EnglishSpeakingSkill
`;

const SalesOperation = `
  type SalesOperation @model
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" },
      ], 
    rule: allow
  )  
  @userPermissions(
    permissions:[
      { userRole: ${UMS_HEAD} appName: "*" operations: "*" },
      { userRole: ${UMS_VIEWER} appName: "*" operations: "*" },
      { userRole: ${MENTOR} appName: "*" operations: "*" }
      ], 
    rule: allow
  ) 
   { 
    userVerificationStatus: SalesTeamStatus @defaultValue(value: "pending")
    userResponseStatus: UserBehaviourStatus @defaultValue(value: "pending")
    overallFeedback: String
    userResponseStatusUpdateDate: Date 
    client: User @relation(name:"SalesOperationClient", direction: "OneWay")
    monitoredBy: User @relation(name:"SalesOperationMonitoredBy", direction: "OneWay")
    salesOperationLog: [SalesOperationLog] @relation(name:"SalesOperationLogSalesOperation")
    nextCallOn: Date
    ${unQualifiedLeadReasons}
    ${sessionRescheduledReasons}
    ${mentorPitch}
    ${studentPersonna}
  }
`;

export default SalesOperation;
