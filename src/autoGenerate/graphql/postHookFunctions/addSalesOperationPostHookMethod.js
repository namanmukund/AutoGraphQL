import { get } from 'lodash';
import { ADMIN, UMS_ADMIN, UMS_VIEWER } from '../../../../constants/roles';
import getReferredByUserIdByAcceptedUserId from '../resolvers/mutation/user/utils/getReferredByUserIdByAcceptedUserId';
import registrationVerificationAddUpdateUserCredit from './utils/registrationVerificationAddUpdateUserCredit';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import addSalesOperationActivityQuery from './utils/addSalesOperationActivityQuery';
import { updateSalesOperationLeadsquared } from './leadsquared';
import getMenteeInfo from './utils/getMenteeInfo';

const allowedRoles = [ADMIN, UMS_ADMIN, UMS_VIEWER];
const addSalesOperationPostHookMethod = async (input, params, mutationName, context) => {
  const { userVerificationStatus } = input;
  const { clientConnectId } = params;
  // this is the role of sales person or admin
  const { currentUser: { role, id: loggedByConnectId } } = context;
  if ((userVerificationStatus && userVerificationStatus === 'verified') && allowedRoles.includes(role)) {
    const referredByUserData = await getReferredByUserIdByAcceptedUserId(clientConnectId);
    if (referredByUserData && referredByUserData.id) {
      await registrationVerificationAddUpdateUserCredit(referredByUserData, clientConnectId, context);
    }
  }
  /*
  SalesOperationActivity add cases
   */
  const { input: queryInput } = params;
  const { leadStatus, nextSteps, nextCallOn } = queryInput;
  if (leadStatus) {
    await callLocalGraphqlApi(
      addSalesOperationActivityQuery(
        loggedByConnectId, input.id, 'leadStatus', leadStatus,
      ),
    );
  }
  if (nextSteps) {
    await callLocalGraphqlApi(
      addSalesOperationActivityQuery(
        loggedByConnectId, input.id, 'nextSteps', nextSteps,
      ),
    );
  }
  if (nextCallOn) {
    await callLocalGraphqlApi(
      addSalesOperationActivityQuery(
        loggedByConnectId, input.id, 'nextCallOn', nextCallOn,
      ),
    );
  }
  const userInfo = await getMenteeInfo(get(input, 'client.typeId'));
  updateSalesOperationLeadsquared(input.id, userInfo);
};

export default addSalesOperationPostHookMethod;
