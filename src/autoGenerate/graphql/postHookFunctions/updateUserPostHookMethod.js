import { get } from 'lodash';
import { auditType } from '../../../../constants';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import { updateUserLeadSquared } from './leadsquared';
import addPreSalesAudit from './utils/addPreSalesAudit';

const { preSales } = auditType;

const fetchUser = async (id) => {
  const query = `
    {
      user(id: "${id}") {
        studentProfile {
          parents {
            user {
              phone {
                number
                countryCode
              }
            }
          }
        }
      }
    }
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.user');
};

const fetchAgentName = async (id) => {
  const query = `
  {
    user(id: "${id}") {
      name
    }
  }
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.user.name');
};
const updateUserVerificationStatus = async (userId, verfiedByUserId) => {
  const query = `
    mutation {
      updateUser(
        id: "${userId}",
        verifiedByConnectId: "${verfiedByUserId}"
        input: {}
      ) {
        id
      }
    }
  `;
  await callLocalGraphqlApi(query);
};
const updateUserPostHookMethod = async (input, mutationName, context) => {
  const userId = get(input, 'id');
  if (get(context, 'verificationStatusFromInput')) {
    updateUserVerificationStatus(userId, get(context, 'currentUser.id'));

    const user = await fetchUser(userId);
    const agentName = await fetchAgentName(get(context, 'currentUser.id'));
    updateUserLeadSquared(
      get(user, 'studentProfile.parents[0].user.phone.number'),
      agentName,
    );
  }
  const isPreSalesAuditFromInput = get(context, 'isPreSalesAuditFromInput');
  const prevIsPreSalesAudit = get(context, 'prevIsPreSalesAudit');
  if (isPreSalesAuditFromInput && prevIsPreSalesAudit === false) {
    addPreSalesAudit(userId, preSales);
  }
};

export default updateUserPostHookMethod;
