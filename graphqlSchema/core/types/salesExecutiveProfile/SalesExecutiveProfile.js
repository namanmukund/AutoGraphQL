import { UMS_HEAD_AND_SALES_EXECUTIVE, NOT_UMS_HEAD_AND_SALES_EXECUTIVE } from '../../../../constants/roles';
import { READ } from '../../../../constants/graphqlOperations';

const SalesExecutiveProfile = `
  type SalesExecutiveProfile @model 
    @userPermissions(
      permissions:[
        { userRole: ${UMS_HEAD_AND_SALES_EXECUTIVE} appName: "*" operations: "*" },
        { userRole: ${NOT_UMS_HEAD_AND_SALES_EXECUTIVE} appName: "*" operations: ${READ} }
        ], 
      rule: allow
    ) {
    user: User! @relation(name: "SalesExecutiveProfileUser")
    mentors: [MentorProfile] @relation(name: "SalesExecutiveProfileMentorProfile")
}`;

export default [SalesExecutiveProfile];
