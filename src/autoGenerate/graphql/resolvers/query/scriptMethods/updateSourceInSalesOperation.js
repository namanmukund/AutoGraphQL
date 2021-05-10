import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import updateSalesOperation from './utils/updateSalesOperation';

const getSalesOperation = async () => {
  const query = `
query{
  salesOperations(filter:{
    client_some:{source:school}
  }){
    id
    source
  }
}
`;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.salesOperations');
};
const updateSourceInSalesOperation = async () => {
  const salesOperations = await getSalesOperation();
  // eslint-disable-next-line no-restricted-syntax
  for (const salesOperation of salesOperations) {
    const salesOperationId = get(salesOperation, 'id');
    if (salesOperationId) {
      // eslint-disable-next-line no-await-in-loop
      await updateSalesOperation(salesOperationId, { source: 'school' });
    }
  }
};

export default updateSourceInSalesOperation;
