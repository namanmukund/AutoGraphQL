import { TLA, TMS, TWA } from '../../../../constants';
import { READ } from '../../../../constants/graphqlOperations';
import getPermissionSchemaString from '../../../../src/autoGenerate/utils/getPermissionSchemaString';

const BatchCurrentComponentStatus = `
  type BatchCurrentComponentStatus @model 
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" },
      { appName: "${TLA}" operations: ${READ} },
      { appName: "${TWA}" operations: ${READ} }
      ], 
    rule: allow
  )
${getPermissionSchemaString('BatchCurrentComponentStatus')}
  {
    batch: Batch! @relation(name: "BatchCurrentComponentStatusBatch")
    currentCourse: Course! @relation(name: "BatchCurrentComponentStatusCourse", direction: "OneWay")
    currentTopic: Topic! @relation(name: "BatchCurrentComponentStatusTopic", direction: "OneWay")
    currentLearningObjective: LearningObjective @relation(name: "BatchCurrentComponentStatusLearningObjective", direction: "OneWay")
    currentPracticeQuestion: QuestionBank @relation(name: "BatchCurrentComponentStatusQuestionBank", direction: "OneWay")
    currentTopicComponentType: CurrentTopicComponentType
    latestSessionStatus: SessionStatus! @defaultValue(value: "allotted")
  }
`;

export default BatchCurrentComponentStatus;
