import { TMS } from '../../../../constants';
import getPermissionSchemaString from '../../../../src/autoGenerate/utils/getPermissionSchemaString';

const AuditQuestion = `
  type AuditQuestion @model 
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" }
      ], 
    rule: allow
  )
  ${getPermissionSchemaString('AuditQuestion')}
  {
    order: Int!
    statement: String! @trim
    score: Int!
    maxRating: Int
    questionType: AuditQuestionType!
    isMandatory: Boolean @defaultValue(value: "false")
    auditType: AuditType!
    mcqOptions: [McqOption]
    ratingDisplayType: RatingDisplayType
    timestampTags: [TimestampTag]
    status: ContentStatus! @defaultValue(value: "unpublished")
  }
`;

export default AuditQuestion;
