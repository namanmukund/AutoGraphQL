import { READ } from '../../../../constants/graphqlOperations';
import { TLA, TMS, TWA } from '../../../../constants';

const Batch = `
  type Batch @model
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" },
      { appName: "${TLA}" operations: ${READ} },
      { appName: "${TWA}" operations: ${READ} }
      ], 
    rule: allow
  )
  {
    course: Course! @relation(name: "BatchCurrentComponentStatusCourse", direction: "OneWay")
    allottedMentor: User! @relation(name:"BatchMentor", direction: "OneWay")
    code: String! @uniqueOrEmpty @trim
    description: String
    students: [StudentProfile] @relation(name: "BatchStudentProfile")
    currentComponent: BatchCurrentComponentStatus @relation(name: "BatchCurrentComponentStatusBatch", isSubset: true)
    type: BatchType @defaultValue(value: "normal")
  }
`;

export default [Batch];
