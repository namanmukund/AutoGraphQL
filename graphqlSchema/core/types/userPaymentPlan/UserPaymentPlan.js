import { TMS } from '../../../../constants';
import { MENTOR, UMS_HEAD, UMS_VIEWER } from '../../../../constants/roles';

const UserPaymentPlan = `
  type UserPaymentPlan @model
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
    user: User! @relation(name: "UserPaymentPlan", direction: "OneWay")
    product: Product! @relation(name: "UserPaymentPlanProduct", direction: "OneWay")
    discount: Discount @relation(name: "UserPaymentPlanDiscount", direction: "OneWay")
    salesOperation: SalesOperation! @relation(name: "SalesOperationUserPaymentPlan")
    userPaymentInstallments: [UserPaymentInstallment] @relation(name: "UserPaymentPlanUserPaymentInstallment")
    sessionsPerMonth: Int!
    installmentType : InstallmentType @defaultValue(value: "auto")
    installmentNumber: Int!
    productPrice: Float!
    finalSellingPrice: Float!
    dateOfEnrollment: Date!
    comment: String
  }
`;

export default UserPaymentPlan;
