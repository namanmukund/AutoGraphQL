import { TMS } from '../../../../constants';

const AuditQuestionSubSection = `
  type AuditQuestionSubSection @model
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" }
      ]
    rule: allow
  ){
    title: String! @unique @trim
    order: Int
}`;

export default [AuditQuestionSubSection];
