import { TMS } from '../../../../constants';
import getPermissionSchemaString from '../../../../src/autoGenerate/utils/getPermissionSchemaString';

const UserPaymentInstallment = `
  type UserPaymentInstallment @model
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" },
      ], 
    rule: allow
  )  
${getPermissionSchemaString('UserPaymentInstallment')}
   { 
  user: User! @relation(name: "UserPaymentInstallment", direction: "OneWay")
  userPaymentPlan: UserPaymentPlan! @relation(name: "UserPaymentPlanUserPaymentInstallment")
  userPaymentLink: UserPaymentLink @relation(name: "UserPaymentInstallmentUserPaymentLink", direction: "OneWay")
  amount: Float!
  dueDate: Date
  paidDate: Date
  lastPaymentRequestedDate: Date
  paymentRequestedCount: Int
  status: UserPaymentInstallmentStatus @defaultValue(value: "pending")
  isPaymentRequested: Boolean
  comment: String
  }`;

export default UserPaymentInstallment;
