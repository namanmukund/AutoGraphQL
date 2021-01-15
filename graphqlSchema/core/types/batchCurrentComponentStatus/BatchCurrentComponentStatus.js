import { TLA, TMS, TWA } from '../../../../constants';
import { NOT_BATCH_HEAD, BATCH_HEAD } from '../../../../constants/roles';
import { READ } from '../../../../constants/graphqlOperations';

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
  @userPermissions(
    permissions:[
      { userRole: ${BATCH_HEAD} appName: "*" operations: "*" },
      { userRole: ${NOT_BATCH_HEAD} appName: "*" operations: ${READ} }
      ], 
    rule: allow
  )
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
