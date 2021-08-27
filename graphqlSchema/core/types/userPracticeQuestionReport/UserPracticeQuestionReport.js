const UserPracticeQuestionReportNextComponentType = `
  type UserPracticeQuestionReportNextComponentType {
   learningObjective: LearningObjective @relation(name: "UserPracticeQuestionReportNextComponentTypeLO", direction: "OneWay")
   nextComponentType: CurrentTopicComponentType
   topic: Topic @relation(name: "UserPracticeQuestionReportNextComponentTypeTopic", direction: "OneWay")
 }`;

const UserPracticeQuestionReport = `
  type UserPracticeQuestionReport @model {
    learningObjective: LearningObjective @relation(name: "UserPQReport", direction: "OneWay")
    user: User! @relation(name: "UserLearningObjective", direction: "OneWay")
    firstTryCount: Int
    secondTryCount: Int
    threeOrMoreTryCount: Int
    helpUsedCount: Int
    answerUsedCount: Int
    nextComponent: UserPracticeQuestionReportNextComponentType @readOnly
    course: Course @relation(name: "UserPracticeQuestionReportCourse", direction: "OneWay")
  }
`;

export default [UserPracticeQuestionReport, UserPracticeQuestionReportNextComponentType];
