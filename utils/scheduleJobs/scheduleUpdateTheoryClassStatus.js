/* eslint-disable no-await-in-loop */

import moment from 'moment';
import { get } from 'lodash';
import callLocalGraphqlApi from '../../src/api/callLocalGraphqlApi';

const getUnCompletedTheoryClasses = async (date) => {
    const query = `{
        batchSessions(filter:{
            and:[
              { batch_some: { documentType:classroom } }
              { topic_some: { classType:theory } }
              { bookingDate_lt: "${date}" }
              { sessionStatus_not: completed }
            ]
        }, orderBy: createdAt_ASC) {
            id
            topic {
              order
            }
        }        
    }`;
    const result = await callLocalGraphqlApi(query);
    return get(result, 'data.batchSessions');
};

const completedTheoryClass = async (id) => {
    const updateQuery = `mutation{
        updateBatchSession(id: "${id}" input: {
            sessionStatus: completed
        }) {
            id
        }
    }
    `;
    const updatedResult = await callLocalGraphqlApi(updateQuery);
    return get(updatedResult, 'data.updateBatchSession')
};

const scheduleUpdateTheoryClassStatus = async() => {
    const oneHourBeforeDate = moment().subtract(1, 'hours').format()
    const batchSessions = await getUnCompletedTheoryClasses(oneHourBeforeDate)
    for (const session of batchSessions) {
        await completedTheoryClass(get(session, 'id'))
    }
}

export default scheduleUpdateTheoryClassStatus;