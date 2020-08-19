import { ADMIN, UMS_ADMIN, UMS_VIEWER } from '../../../../constants/roles';
import getReferredByUserIdByAcceptedUserId from '../resolvers/mutation/user/utils/getReferredByUserIdByAcceptedUserId';
import registrationVerificationAddUpdateUserCredit from './utils/registrationVerificationAddUpdateUserCredit';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import addSalesOperationActivityQuery from './utils/addSalesOperationActivityQuery';
import isEqualDates from '../../../../utils/isEqualDates';

const allowedRoles = [ADMIN, UMS_ADMIN, UMS_VIEWER];
const updateSalesOperationPostHookMethod = async (input, params, mutationName, context) => {
  const { userVerificationStatus, client: { typeId } } = input;
  // this is the role of sales person or admin
  const { currentUser: { role, id: loggedByConnectId }, previousDocument } = context;
  const { userVerificationStatus: prevUserVerificationStatus } = previousDocument;
  if (
    userVerificationStatus
    && userVerificationStatus === 'verified'
    && prevUserVerificationStatus !== 'verified'
    && allowedRoles.includes(role)
  ) {
    const referredByUserId = await getReferredByUserIdByAcceptedUserId(typeId);
    if (referredByUserId) {
      await registrationVerificationAddUpdateUserCredit(referredByUserId, typeId, context);
    }
  }
  /*
      salesOperationActivity cases
   */
  const { leadStatus: prevLeadStatus, nextSteps: prevNextSteps, nextCallOn: prevNextCallOn } = previousDocument;
  const { leadStatus, nextSteps, nextCallOn } = input;
  // cases of set leadStatus ---------------------------------------------------------------------------
  if (!prevLeadStatus && leadStatus) {
    await callLocalGraphqlApi(
      addSalesOperationActivityQuery(
        loggedByConnectId, input.id, 'leadStatus', leadStatus,
      ),
    );
  }
  // case of update  leadStatus
  if (prevLeadStatus && leadStatus && (prevLeadStatus !== leadStatus)) {
    await callLocalGraphqlApi(
      addSalesOperationActivityQuery(
        loggedByConnectId, input.id, 'leadStatus', leadStatus, prevLeadStatus,
      ),
    );
  }

  // case of set nextSteps ---------------------------------------------------------------------------
  if (!prevNextSteps && nextSteps) {
    await callLocalGraphqlApi(
      addSalesOperationActivityQuery(
        loggedByConnectId, input.id, 'nextSteps', nextSteps,
      ),
    );
  }
  // case of update  nextSteps
  if (prevNextSteps && nextSteps && (prevNextSteps !== nextSteps)) {
    await callLocalGraphqlApi(
      addSalesOperationActivityQuery(
        loggedByConnectId, input.id, 'nextSteps', nextSteps, prevNextSteps,
      ),
    );
  }

  // case of set prevNextCallOn ---------------------------------------------------------------------------
  if (!prevNextCallOn && nextCallOn) {
    await callLocalGraphqlApi(
      addSalesOperationActivityQuery(
        loggedByConnectId, input.id, 'nextCallOn', nextCallOn,
      ),
    );
  }
  // case of update  prevNextCallOn
  if (prevNextCallOn && nextCallOn && !(isEqualDates(prevNextCallOn, nextCallOn))) {
    await callLocalGraphqlApi(
      addSalesOperationActivityQuery(
        loggedByConnectId, input.id, 'nextCallOn', nextCallOn, prevNextCallOn,
      ),
    );
  }
};

export default updateSalesOperationPostHookMethod;
