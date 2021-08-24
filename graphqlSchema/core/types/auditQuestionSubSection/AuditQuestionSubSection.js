import { TMS } from '../../../../constants';

const AuditQuestionSubSection = `
  type AuditQuestionSubSection @model
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" }
      ]
    rule: allow
  ){
    title: String! @trim
    order: Int
    auditType: AuditType!
}`;

export default [AuditQuestionSubSection];
