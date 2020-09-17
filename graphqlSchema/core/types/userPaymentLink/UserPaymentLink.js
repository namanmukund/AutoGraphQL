import { TMS } from '../../../../constants';
import { MENTOR, UMS_HEAD, UMS_VIEWER } from '../../../../constants/roles';

const UserPaymentLink = `
  type UserPaymentLink @model
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" },
      ], 
    rule: allow
  )  
  @userPermissions(
    permissions:[
      { userRole: ${UMS_HEAD} appName: "*" operations: "*" },
      { userRole: ${UMS_VIEWER} appName: "*" operations: "*" },
      { userRole: ${MENTOR} appName: "*" operations: "*" }
      ], 
    rule: allow
  ) 
  { 
    amount: Float!
    link: String!
  }
`;

export default UserPaymentLink;
