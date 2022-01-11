/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
import { get } from 'lodash';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';

const getRegisteredUserFromEvent = async (eventId) => {
  const eventQuery = `{
    event(id: "${eventId}") {
        id
        registeredUsers {
        id
        }
    }
    }
    `;
  const result = await callLocalGraphqlApi(eventQuery);
  return get(result, 'data.event.registeredUsers', []);
};

const getPrevAddedStudentsToSession = async (eventSessionId) => {
  const query = `{
  eventSession(id:"${eventSessionId}") {
    id
    attendance {
      student {
        id
      }
    }
  }
}`;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.eventSession.attendance', []);
};

const addEventSessionPostHookMethod = async (input, params, mutationName, context) => {
  const eventConnectId = get(params, 'eventConnectId');
  const registeredUsers = await getRegisteredUserFromEvent(eventConnectId);
  // console.log(params);
};

export default addEventSessionPostHookMethod;
