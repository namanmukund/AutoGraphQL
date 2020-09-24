import { TMS } from '../../../../constants';
import { MENTOR, UMS_HEAD, UMS_VIEWER } from '../../../../constants/roles';

const UserPaymentInstallment = `
  type UserPaymentInstallment @model
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
