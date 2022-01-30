import { get } from 'lodash';
import { log } from '../../../../../utils';
import extractSlotsFromInput from '../../../../../utils/extractSlotsFromInput';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import sendAutoAssignmentFailedMessage from './sendAutoAssignmentFailedMessage';

// query to fetch mentorSession
const fetchMentorSessions = async (date, slots) => {
  const query = `
  query{
    mentorSessions(
      filter: {and: [
        {sessionType: trial},
        {availabilityDate: "${date}"}
        ${slots}
      ]}, orderBy:createdAt_ASC, first: 1) {
      id
      user{
        id
      }
    }
  }
  `;
  const res = await callLocalGraphqlApi(query, '');
  return get(res, 'data.mentorSessions', []);
};

// mutation to add mentor mentee session
const callAddMentorMenteeSession = async (
  topicConnectId,
  menteeSessionConnectId,
  mentorSessionConnectId,
  variables,
  courseConnectId,
) => {
  const query = `
mutation($input: MentorMenteeSessionInput!){
  addMentorMenteeSession(
    input:$input
    topicConnectId:"${topicConnectId}"
    menteeSessionConnectId:"${menteeSessionConnectId}"
    mentorSessionConnectId:"${mentorSessionConnectId}"
    ${courseConnectId ? `courseConnectId: "${courseConnectId}"` : ''}
  ){
    id
  }
}
`;
  const res = await callLocalGraphqlApi(query, '', variables);
  return get(res, 'data.addMentorMenteeSession.id');
};

// mutation to add new task
const callAddTask = async (
  mentorMenteeSessionId,
  menteeSessionId,
  mentorUserId,
  taskStatus,
) => {
  const query = `
mutation{
  addTask(
    menteeSessionConnectId: "${menteeSessionId}"
    ${mentorMenteeSessionId ? `mentorMenteeSessionConnectId: "${mentorMenteeSessionId}"` : ''}
    ${mentorUserId ? `assignedToConnectId: "${mentorUserId}"` : ''}
    input: {
      status: ${taskStatus}
    }){
    id
  }
}
`;
  const res = await callLocalGraphqlApi(query, '');
  return get(res, 'data.addTask.id');
};

const createTaskAndAssignAvailableMentor = async (
  context,
  userInfo,
  topicInfo,
  input,
) => {
  const { id: menteeSessionId, bookingDate, ...slots } = input;
  const { filteredSlotsStringForFilterQuery } = extractSlotsFromInput(slots);
  // console.log('filteredSlotsStringForFilterQuery', filteredSlotsStringForFilterQuery);
  const topicId = get(topicInfo, 'data.topic.id', '');
  const courseId = get(input, 'course.typeId', '');
  // console.log('topicId', topicId);
  // console.log('courseId', courseId);
  let mentorUserId = '';
  let mentorMenteeSessionId = '';
  // fetch mentor sessions, from the earliest created
  const avalilableMentorSession = await fetchMentorSessions(bookingDate, filteredSlotsStringForFilterQuery);
  // console.log('avalilableMentorSession', avalilableMentorSession);
  try {
    if (avalilableMentorSession && avalilableMentorSession.length && get(avalilableMentorSession, '[0].id')) {
      const mentorSessionId = get(avalilableMentorSession, '[0].id');
      mentorUserId = get(avalilableMentorSession, '[0].user.id');
      const variables = {
        input: {
          sessionStatus: 'allotted',
        },
      };
      // add mentor mentee session
      mentorMenteeSessionId = await callAddMentorMenteeSession(topicId, menteeSessionId, mentorSessionId, variables, courseId);
    }
  } catch (err) {
    log('Error Adding Mentor Mentee Session');
  }
  // console.log('mentorMenteeSessionId', mentorMenteeSessionId);
  // add task irrespective of whether the mentorMenteeSession is created or not
  // if mentorMenteeSession is created, taskStatus should be "assigned" else "pending"
  let taskStatus = 'unassigned';
  if (mentorMenteeSessionId) {
    taskStatus = 'assigned';
  }
  const taskId = await callAddTask(mentorMenteeSessionId, menteeSessionId, mentorUserId, taskStatus);
  if (taskStatus === 'unassigned') {
    // send message to MSM when auto assignment failed
    log('Auto Assignment Failed');
    sendAutoAssignmentFailedMessage(context, userInfo);
  }
  return {
    mentorMenteeSessionId,
    taskId,
  };
};

export default createTaskAndAssignAvailableMentor;
