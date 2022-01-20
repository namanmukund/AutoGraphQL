/*eslint-disable*/
import { get } from 'lodash';
import { ConnectIdRequiredError } from '../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { SimilarDocumentAlreadyExistError, CurrentChildIsMentorChild } from '../../../../../constants/errors/db';
import getUserSource from './utils/getUserSource';
import updateUserSpecificDetailsInParams from './utils/updateUserSpecificDetailsInParams';
import isMentorChild from '../../postHookFunctions/utils/isMentorChild';

const salesOperationsMetaQuery = (clientConnectId, courseConnectId) => `
query{
  salesOperationsMeta(filter:{ and: [
    { client_some: { id: "${clientConnectId}" } }, 
    { course_some: { id: "${courseConnectId}" } }
  ] }){
    count
  }
}
`;

const addSalesOperationValidation = async (params) => {
  const { clientConnectId, monitoredByConnectId, courseConnectId } = params;
  const isItMentorChild = await isMentorChild(clientConnectId);
  if (isItMentorChild) {
    throw new CurrentChildIsMentorChild();
  }
  if (!clientConnectId && !monitoredByConnectId && !courseConnectId) {
    throw new ConnectIdRequiredError();
  }
  const salesOperationsMeta = await callLocalGraphqlApi(salesOperationsMetaQuery(clientConnectId, courseConnectId));
  const clientCount = get(salesOperationsMeta, 'data.salesOperationsMeta.count');
  if (clientCount > 0) {
    throw new SimilarDocumentAlreadyExistError();
  }
  // if update source  in sales operation
  const userData = await getUserSource(clientConnectId);
  updateUserSpecificDetailsInParams(userData, params);
};

export default addSalesOperationValidation;
