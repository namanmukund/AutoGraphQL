import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const salesOperationQuery = () => `
query{
  salesOperations(
    first: 1000,
    skip: 0,
     orderBy: createdAt_DESC
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
      // eslint-disable-next-line no-console
      console.log('------------------------------saleOperation.id', saleOperation.id);
      count += 1;
      await callLocalGraphqlApi(updateUserSalesOperation(
        saleOperation.id,
      ));
    }
  });
  // eslint-disable-next-line no-console
  console.log('------------------------------count', count);
};

export default addDefaultEnrollmentTypeInSalesOperation;
