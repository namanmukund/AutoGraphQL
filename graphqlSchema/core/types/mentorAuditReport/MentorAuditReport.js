import { READ } from '../../../../constants/graphqlOperations';
import { TLA, TMS, TWA } from '../../../../constants';
import {
  UMS_HEAD, NOT_UMS_HEAD,
} from '../../../../constants/roles';

const MentorAuditReport = `
  type MentorAuditReport @model
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
      { userRole: ${UMS_HEAD} appName: "*" operations: "*" },
      { userRole: ${NOT_UMS_HEAD} appName: "*" operations: ${READ} },
      ], 
    rule: allow
  ) 
  {
    mentor: MentorProfile @relation(name:"MentorAuditAnalytics", direction: "OneWay")
    totalCompletedSessionsCount: Int
    totalAuditSessionsCount: Int
    averageAuditScore: Int
    averageAuditRating: Int
  }
`;

export default [MentorAuditReport];
