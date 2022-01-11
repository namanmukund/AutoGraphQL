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
  // console.log(JSON.stringify(result));
};

const addEventSessionPostHookMethod = async (input, params, mutationName, context) => {
  const eventConnectId = get(params, 'eventConnectId');
  const registeredUsers = await getRegisteredUserFromEvent(eventConnectId);
  // console.log(params);
};

export default addEventSessionPostHookMethod;
