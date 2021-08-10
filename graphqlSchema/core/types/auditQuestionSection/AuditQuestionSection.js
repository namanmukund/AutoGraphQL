import { TMS } from '../../../../constants';

const AuditQuestionSection = `
  type AuditQuestionSection @model
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" }
      ]
    rule: allow
  ){
    title: String!
    order: Int
}`;

export default [AuditQuestionSection];
