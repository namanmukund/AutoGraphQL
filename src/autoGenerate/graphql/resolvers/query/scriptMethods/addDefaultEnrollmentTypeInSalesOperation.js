import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const salesOperationQuery = () => `
query{
  salesOperations(
    filter:{
      and:[
        {
          createdAt_lte:"2020-11-30"
        }
      ]
    }
  ){
    id
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
    enrollmentType: free
  }
  ){
    id
  }
}
`;

const addDefaultEnrollmentTypeInSalesOperation = async () => {
  const salesOperationRes = await callLocalGraphqlApi(salesOperationQuery());
  const salesOperationsArray = get(salesOperationRes, 'data.salesOperations', []);
  let count = 0;
  salesOperationsArray.forEach(async (saleOperation) => {
    if (saleOperation.id) {
      count += 1;
      await callLocalGraphqlApi(updateUserSalesOperation(
        saleOperation.id,
      ));
    }
  });
  console.log('------------------------------count', count);
};

export default addDefaultEnrollmentTypeInSalesOperation;
