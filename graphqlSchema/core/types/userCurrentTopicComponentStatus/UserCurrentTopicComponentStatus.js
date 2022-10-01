import { TLA, TMS, TWA } from '../../../../constants';
import { READ } from '../../../../constants/graphqlOperations';
import getPermissionSchemaString from '../../../../src/autoGenerate/utils/getPermissionSchemaString';

const UserCurrentTopicComponentStatus = `
  type UserCurrentTopicComponentStatus @model 
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" },
      { appName: "${TLA}" operations: ${READ} },
      { appName: "${TWA}" operations: ${READ} }
      ], 
    rule: allow
  )
  ${getPermissionSchemaString('UserCurrentTopicComponentStatus')}
  {
    user: User! @relation(name: "UserCurrentTopicComponentStatus", direction: "OneWay")
    currentCourse: Course! @relation(name: "UserCurrentTopicComponentStatusCourse", direction: "OneWay")
    enrollmentType: EnrollmentType! @defaultValue(value: "free")
    currentTopic: Topic! @relation(name: "UserCurrentTopicComponentStatusTopic", direction: "OneWay")
    currentLearningObjective: LearningObjective @relation(name: "UserCurrentTopicComponentStatusLearningObjective", direction: "OneWay")
    currentPracticeQuestion: QuestionBank @relation(name: "UserCurrentTopicComponentStatusQuestionBank", direction: "OneWay")
    currentTopicComponentType: CurrentTopicComponentType!
    currentVideo: Video @relation(name: "UserCurrentTopicComponentStatusVideo", direction: "OneWay")
    currentBlockBasedProject: BlockBasedProject @relation(name: "UserCurrentTopicComponentStatusBlockBasedProject", direction: "OneWay")
    currentLearningSlide: LearningSlide @relation(name: "UserCurrentTopicComponentStatusLearningSlide", direction: "OneWay")
    skillsLevel: SkillsLevel @defaultValue(value: "easy")
  }
`;

export default UserCurrentTopicComponentStatus;
