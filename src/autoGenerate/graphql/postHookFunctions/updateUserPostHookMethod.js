import { get } from 'lodash';
import { auditType } from '../../../../constants';
import { MENTEE, PARENT } from '../../../../constants/roles';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import { updateUserLeadSquared } from './leadsquared';
import addSalesAudit from './utils/addSalesAudit';
import isMentorChild from './utils/isMentorChild';

const { preSales } = auditType;

const fetchUser = async (id, context) => {
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
  const res = await callLocalGraphqlApi(query, context);
  return get(res, 'data.user');
};

const fetchAgentName = async (id, context) => {
  const query = `
  {
    user(id: "${id}") {
      name
    }
  }
  `;
  const res = await callLocalGraphqlApi(query, context);
  return get(res, 'data.user.name');
};

const fetchBookedSession = async (id, context) => {
  const query = `
  {
    menteeSessions(
      filter: { and: [{ user_some: { id: "${id}" } }, { topic_some: { order: 1 } }] }
    ) {
      id
    }
  }
  `;
  const res = await callLocalGraphqlApi(query, context);
  return get(res, 'data.menteeSessions', []).length;
};

const updateUserVerificationStatus = async (userId, verfiedByUserId, context) => {
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
  await callLocalGraphqlApi(query, context);
};
const updateUserPostHookMethod = async (input, mutationName, context) => {
  const userId = get(input, 'id');
  if (get(context, 'verificationStatusFromInput')) {
    const isVerified = get(context, 'verificationStatusFromInput') === 'verified';
    updateUserVerificationStatus(userId, get(context, 'currentUser.id'), context);
    let agentName = '';
    if (get(context, 'currentUser.role') === PARENT || get(context, 'currentUser.role') === MENTEE) {
      agentName = 'Parent';
    } else {
      agentName = await fetchAgentName(get(context, 'currentUser.id'), context);
    }
    const user = await fetchUser(userId, context);
    const isItMentorChild = await isMentorChild(userId);
    if (!isItMentorChild) {
      updateUserLeadSquared(
        get(user, 'studentProfile.parents[0].user.phone.number'),
        agentName,
        isVerified,
        await fetchBookedSession(userId, context),
      );
    }
  }
  const isPreSalesAuditFromInput = get(context, 'isPreSalesAuditFromInput');
  const prevIsPreSalesAudit = get(context, 'prevIsPreSalesAudit');
  if (isPreSalesAuditFromInput && prevIsPreSalesAudit === false) {
    addSalesAudit({ clientId: userId, auditType: preSales });
  }
};

export default updateUserPostHookMethod;
