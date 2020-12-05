import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const salesOperationQuery = () => `
query{
  userPaymentPlans{
    salesOperation{
      id
    }
  }
}
`;

const updateUserSalesOperation = (
  id,
) => `
 mutation{
  updateSalesOperation(
  id: "${id}",
  input:{
    enrollmentType: pro
  }
  ){
    id
  }
}
`;

const addProEnrollmentTypeInSalesOperation = async () => {
  const userPaymentPlanRes = await callLocalGraphqlApi(salesOperationQuery());
  const userPaymentArray = get(userPaymentPlanRes, 'data.userPaymentPlans', []);
  let count = 0;
  userPaymentArray.forEach(async (userPayment) => {
    if (userPayment.salesOperation && userPayment.salesOperation.id) {
      count += 1;
      await callLocalGraphqlApi(updateUserSalesOperation(
        userPayment.salesOperation.id,
      ));
    }
  });
  console.log('------------------------------count', count);
};

export default addProEnrollmentTypeInSalesOperation;
