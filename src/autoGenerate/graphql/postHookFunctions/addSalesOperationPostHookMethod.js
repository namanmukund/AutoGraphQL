import { ADMIN, UMS_ADMIN, UMS_VIEWER } from '../../../../constants/roles';
import getReferredByUserIdByAcceptedUserId from '../resolvers/mutation/user/utils/getReferredByUserIdByAcceptedUserId';
import registrationVerificationAddUpdateUserCredit from './utils/registrationVerificationAddUpdateUserCredit';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';

const addSalesOperationActivtyQuery = (
  loggedByConnectId,
  salesOperationConnectId,
  actionType,
  actionOn,
  setData,
) => `mutation{
  addSalesOperationActivity(input:{
    actionType:${actionType}
    actionOn:${actionOn}
    setData: "${setData}"
  }, loggedByConnectId:"${loggedByConnectId}",salesOperationConnectId:"${salesOperationConnectId}"){
    id
  }
}`;

const allowedRoles = [ADMIN, UMS_ADMIN, UMS_VIEWER];
const addSalesOperationPostHookMethod = async (input, params, mutationName, context) => {
  const { userVerificationStatus } = input;
  const { clientConnectId } = params;
  // this is the role of sales person or admin
  const { currentUser: { role, id: loggedByConnectId } } = context;
  if ((userVerificationStatus && userVerificationStatus === 'verified') && allowedRoles.includes(role)) {
    const referredByUserId = await getReferredByUserIdByAcceptedUserId(clientConnectId);
    if (referredByUserId) {
      await registrationVerificationAddUpdateUserCredit(referredByUserId, clientConnectId, context);
    }
  }
  /*
  SalesOperationActivity add cases
   */
  const { input: queryInput } = params;
  const { leadStatus, nextSteps, nextCallOn } = queryInput;
  if (leadStatus) {
    await callLocalGraphqlApi(addSalesOperationActivtyQuery(
      loggedByConnectId,
      input.id,
      'set',
      'leadStatus',
      leadStatus,
    ));
  }
  if (nextSteps) {
    await callLocalGraphqlApi(addSalesOperationActivtyQuery(
      loggedByConnectId,
      input.id,
      'set',
      'nextSteps',
      nextSteps,
    ));
  }
  if (nextCallOn) {
    await callLocalGraphqlApi(addSalesOperationActivtyQuery(
      loggedByConnectId,
      input.id,
      'set',
      'nextCallOn',
      nextCallOn,
    ));
  }
};

export default addSalesOperationPostHookMethod;
