import { TMS } from '../../../../constants';
import getPermissionSchemaString from '../../../../src/autoGenerate/utils/getPermissionSchemaString';

const UserPaymentPlan = `
  type UserPaymentPlan @model
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" },
      ], 
    rule: allow
  )  
${getPermissionSchemaString('UserPaymentPlan')}
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
    userStatus: Status! @defaultValue(value: "active")
  }
`;

export default UserPaymentPlan;
