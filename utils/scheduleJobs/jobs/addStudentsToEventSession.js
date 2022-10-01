import { get } from 'lodash';
import callLocalGraphqlApi from '../../../src/api/callLocalGraphqlApi';

const getJob = async (jobId) => {
  const query = `{
    scheduleJob(id: "${jobId}") {
      id
    }
  }
  `;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.scheduleJob');
};

const getEventSessionDetail = async (eventSessionId) => {
  const eventSessionQuery = `{
  eventSession(id: "${eventSessionId}") {
    id
    event {
      registeredUsers {
        id
      }
    }
    attendance {
      student {
        id
      }
    }
  }
}`;
  const eventSession = await callLocalGraphqlApi(eventSessionQuery);
  return get(eventSession, 'data.eventSession');
};

const updateEventSession = async (eventSessionId, pushManyQuery) => {
  const updateQuery = `mutation {
    updateEventSession(id: "${eventSessionId}", input: { ${pushManyQuery || ''} }) {
      id
    }
  }
  `;
  const updatedSession = await callLocalGraphqlApi(updateQuery);
  return get(updatedSession, 'data.updateEventSession');
};

const addStudentToEventSession = async ({ eventSessionId, jobId }, deleteJob = () => {}) => {
  const scheduleJob = await getJob(jobId);
  if (scheduleJob) {
    const eventSessionDetail = await getEventSessionDetail(eventSessionId);
    if (eventSessionDetail) {
      const { event, attendance = [] } = eventSessionDetail;
      const registeredUsers = get(event, 'registeredUsers');
      let pushManyQuery = '';
      const alreadyAddedUser = attendance.map((attendee) => get(attendee, 'student.id'));
      registeredUsers.forEach((user) => {
        if (!alreadyAddedUser.includes(get(user, 'id'))) {
          pushManyQuery += `{studentConnectId: "${get(user, 'id')}",},`;
        }
      });
      if (pushManyQuery) pushManyQuery = `attendance:{ pushMany: [${pushManyQuery}] }`;
      if (pushManyQuery) {
        updateEventSession(eventSessionId, pushManyQuery);
      }
    }
    deleteJob();
  }
};

export default addStudentToEventSession;
