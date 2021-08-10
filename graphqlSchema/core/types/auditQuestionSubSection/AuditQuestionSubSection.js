import { TMS } from '../../../../constants';

const AuditQuestionSubSection = `
  type AuditQuestionSubSection @model
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" }
      ]
    rule: allow
  ){
    title: String!
    order: Int
}`;

export default [AuditQuestionSubSection];
