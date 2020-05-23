import { TLA, TMS, TWA } from '../../../../constants';
import { READ } from '../../../../constants/graphqlOperations';

const UserCurrentTopicComponentStatus = `
  type UserCurrentTopicComponentStatus @model 
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: ${READ} },
      { appName: "${TLA}" operations: ${READ} },
      { appName: "${TWA}" operations: ${READ} }
      ], 
    rule: allow
  )
  {
    user: User! @relation(name: "UserCurrentTopicComponentStatus", direction: "OneWay")
    currentCourse: Course! @relation(name: "UserCurrentTopicComponentStatusCourse", direction: "OneWay")
    enrollmentType: EnrollmentType! @defaultValue(value: "free")
    currentTopic: Topic! @relation(name: "UserCurrentTopicComponentStatusTopic", direction: "OneWay")
    currentLearningObjective: LearningObjective @relation(name: "UserCurrentTopicComponentStatusLearningObjective", direction: "OneWay")
    currentPracticeQuestion: QuestionBank @relation(name: "UserCurrentTopicComponentStatusQuestionBank", direction: "OneWay")
    currentTopicComponentType: CurrentTopicComponentType!
  }
`;

export default UserCurrentTopicComponentStatus;
