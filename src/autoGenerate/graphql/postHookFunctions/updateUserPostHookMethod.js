import { get } from 'lodash';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import { updateUserLeadSquared } from './leadsquared';

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
};

export default updateUserPostHookMethod;
