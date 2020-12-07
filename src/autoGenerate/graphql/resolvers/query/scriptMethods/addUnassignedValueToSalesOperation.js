import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const salesOperationQuery = () => `
query{
  salesOperations(
    filter:{
      and:[
        {
          leadStatus_exists: false
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
    leadStatus:unassigned
  }
  ){
    id
  }
}
`;

const addUnassignedValueToSalesOperation = async () => {
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
  // eslint-disable-next-line no-console
  console.log('------------------------------count', count);
};

export default addUnassignedValueToSalesOperation;
