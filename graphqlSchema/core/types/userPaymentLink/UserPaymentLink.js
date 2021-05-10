import { TMS } from '../../../../constants';
import getPermissionSchemaString from '../../../../src/autoGenerate/utils/getPermissionSchemaString';

const UserPaymentLink = `
  type UserPaymentLink @model
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" },
      ], 
    rule: allow
  )  
${getPermissionSchemaString('UserPaymentLink')}
  { 
    type: UserPaymentLinkType
    amount: Float
    link: String!
  }
`;

export default UserPaymentLink;
