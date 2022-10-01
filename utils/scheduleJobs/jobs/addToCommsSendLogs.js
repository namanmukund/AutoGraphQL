/* eslint-disable no-console */
import { get } from 'lodash';
import callLocalGraphqlApi from '../../../src/api/callLocalGraphqlApi';

const addToCommsSendLogs = async ({
  templateName, triggeredAt, studentProfileId, eventId,
  condition, unit, value, attendanceFilter,
}) => {
  if (templateName && triggeredAt) {
    const addQuery = `mutation {
    addCommsSendLog(
      input: {
        templateName: "${templateName}", triggeredAt: "${new Date(triggeredAt).toISOString()}" 
        ${condition ? `condition:"${condition}"` : ''}
        ${unit ? `unit:"${unit}"` : ''}
        ${value ? `value:"${value}"` : ''}
        ${attendanceFilter ? `attendanceFilter:"${attendanceFilter}"` : ''}
      }
      ${studentProfileId ? `studentProfileConnectId: "${studentProfileId}"` : ''}
      ${eventId ? `eventConnectId: "${eventId}"` : ''}
    ) {
      id
    }
  }
  `;
    const result = await callLocalGraphqlApi(addQuery);
    // eslint-disable-next-line no-console
    console.log(`comms log added ${get(result, 'data.addCommsSendLog.id')}`);
    return get(result, 'data.addCommsSendLog', null);
  }
  return true;
};

export default addToCommsSendLogs;
