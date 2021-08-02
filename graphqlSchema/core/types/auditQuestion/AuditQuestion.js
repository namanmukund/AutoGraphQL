import { READ } from '../../../../constants/graphqlOperations';
import { TLA, TMS, TWA } from '../../../../constants';
import getPermissionSchemaString from '../../../../src/autoGenerate/utils/getPermissionSchemaString';

const AuditQuestion = `
  type AuditQuestion @model 
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" },
      { appName: "${TLA}" operations: ${READ} },
      { appName: "${TWA}" operations: ${READ} }
      ], 
    rule: allow
  )
  ${getPermissionSchemaString('AuditQuestion')}
  {
    order: Int!
    statement: String! @trim
    questionType: AuditQuestionType! @defaultValue(value: "mcq")
    isMandatory: Boolean @defaultValue(value: "false")
    auditType: AuditType!
    mcqOptions: [McqOption]
    ratingDisplayType: RatingDisplayType
    timestampTags: [TimestampTag]
    status: ContentStatus! @defaultValue(value: "unpublished")
  }
`;

export default AuditQuestion;
