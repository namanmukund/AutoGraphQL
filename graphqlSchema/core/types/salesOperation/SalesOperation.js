import { TMS, TWA } from '../../../../constants';
import getPermissionSchemaString from '../../../../src/autoGenerate/utils/getPermissionSchemaString';

const unQualifiedLeadReasons = `
    knowCoding: Boolean
    lookingForAdvanceCourse: Boolean
    ageNotAppropriate: Boolean
    notRelevantDifferentStream: Boolean
    noPayingPower: Boolean
    payingPower: YesNoAverage
    notInterestedInCoding: Boolean
    learningAptitudeIssue: Boolean
    notAQualifiedLeadComment: String
`;

const sessionRescheduledReasons = `
    hasRescheduled: Boolean
    isMentorReadyToTakeClass: Boolean
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
    personality: UserPersonality
    fastLearner: YesNoAverage
    learningSpeed: WeakSlowAverageFast
    studentEnglishSpeakingSkill: EnglishSpeakingSkill
    parentEnglishSpeakingSkill: EnglishSpeakingSkill
`;

const userPaymentPlan = `
  userPaymentPlan: UserPaymentPlan @relation(name: "SalesOperationUserPaymentPlan")
`;

const studentIQQuestions = `
  criticalThinking: Int @length(min: 1, max: 5)
  logicalThinking: Int @length(min: 1, max: 5)
  communicationSkills: Int @length(min: 1, max: 5)
  problemSolvingAbility: Int @length(min: 1, max: 5)
  creativeSkills: Int @length(min: 1, max: 5)
  studentNote: StudentNoteForIQ
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

${getPermissionSchemaString('SalesOperation')}
   {
    course: Course @relation(name: "SalesOperationCourse", direction: "OneWay")
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
    country: Country @defaultValue(value: "india")
    enrollmentType: EnrollmentType @defaultValue(value: "free")
    ${unQualifiedLeadReasons}
    ${sessionRescheduledReasons}
    ${mentorPitch}
    ${studentPersonna}
    ${userPaymentPlan}
    ${studentIQQuestions}
    sessionCommentByMentor: String
  }
`;

export default SalesOperation;
