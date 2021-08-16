import { TMS } from '../../../../constants';

const AuditQuestionSection = `
  type AuditQuestionSection @model
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" }
      ]
    rule: allow
  ){
    title: String! @unique @trim
    order: Int
    auditType: AuditType!
}`;

export default [AuditQuestionSection];
