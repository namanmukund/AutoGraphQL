import { get } from 'lodash';
import { ConnectIdRequiredError } from '../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { SimilarDocumentAlreadyExistError } from '../../../../../constants/errors/db';
import getUserSource from './utils/getUserSource';

const salesOperationsMetaQuery = (clientConnectId) => `
query{
  salesOperationsMeta(filter:{
    client_some:{id:"${clientConnectId}"}
  }){
    count
  }
}
`;

const addSalesOperationValidation = async (params) => {
  const { clientConnectId, monitoredByConnectId } = params;
  if (!clientConnectId && !monitoredByConnectId) {
    throw new ConnectIdRequiredError();
  }
  const salesOperationsMeta = await callLocalGraphqlApi(salesOperationsMetaQuery(clientConnectId));
  const clientCount = get(salesOperationsMeta, 'data.salesOperationsMeta.count');
  if (clientCount > 0) {
    throw new SimilarDocumentAlreadyExistError();
  }
  // if update source  in sales operation
  const source = await getUserSource(clientConnectId);
  if (source) {
    if (!get(params, 'input')) {
      // eslint-disable-next-line no-param-reassign
      params.input = {};
    }
    // eslint-disable-next-line no-param-reassign
    params.input.source = source;
  }
};

export default addSalesOperationValidation;
