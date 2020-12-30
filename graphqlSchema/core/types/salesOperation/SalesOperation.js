import { TMS, TWA } from '../../../../constants';
import {
  MENTEE, MENTOR, UMS_HEAD, UMS_VIEWER, SALES,
} from '../../../../constants/roles';
import { READ } from '../../../../constants/graphqlOperations';

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
    rescheduledDate: Date
    rescheduledDateProvided: Boolean
    internetIssue: Boolean
    zoomIssue: Boolean
    laptopIssue: Boolean
    chromeIssue: Boolean
    powerCut: Boolean
    notResponseAndDidNotTurnUp: Boolean
    turnedUpButLeftAbruptly: Boolean
    leadNotVerifiedProperly: Boolean
    otherReasonForReschedule: Boolean
    otherReasonsComment: String
`;

const mentorPitch = `
    pricingPitched: Boolean
    parentCounsellingDone: Boolean
    courseInterestedIn: ProductType
    oneToOne: Boolean
    oneToTwo: Boolean
    oneToThree: Boolean
    leadStatus: LeadStatus @groupBy @defaultValue(value: "unassigned")
    nextSteps: NextStep
    otherReasonForNextStep: String
    nextCallOn: Date
`;

const studentPersonna = `
    prodigyChild: Boolean
    extrovertStudent: YesNoAverage
    fastLearner: YesNoAverage
    studentEnglishSpeakingSkill: EnglishSpeakingSkill
    parentEnglishSpeakingSkill: EnglishSpeakingSkill
`;

const userPaymentPlan = `
  userPaymentPlan: UserPaymentPlan @relation(name: "SalesOperationUserPaymentPlan")
`;

const SalesOperation = `
  type SalesOperation @model
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" },
      { appName: "${TWA}" operations: "*" },
      ], 
    rule: allow
  )  
  @userPermissions(
    permissions:[
      { userRole: ${UMS_HEAD} appName: "*" operations: "*" },
      { userRole: ${UMS_VIEWER} appName: "*" operations: "*" },
      { userRole: ${MENTOR} appName: "*" operations: "*" },
      { userRole: ${SALES} appName: "*" operations: "*" },
      { userRole: ${MENTEE} appName: "*" operations: ${READ} }
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
    allottedMentor: User @relation(name:"SalesOperationAllottedMentor", direction: "OneWay")
    firstMentorMenteeSession: MentorMenteeSession @relation(name:"SalesOperationFirstMentorMenteeSession")
    salesOperationLog: [SalesOperationLog] @relation(name:"SalesOperationLogSalesOperation")
    salesOperationActivities: [SalesOperationActivity] @relation(name:"SalesOperationActivitySalesOperation")
    source: UserOriginSource
    enrollmentType: EnrollmentType @defaultValue(value: "free")
    ${unQualifiedLeadReasons}
    ${sessionRescheduledReasons}
    ${mentorPitch}
    ${studentPersonna}
    ${userPaymentPlan}
  }
`;

export default SalesOperation;
