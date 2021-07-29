import { get } from 'lodash';
import {
  GLOBAL_COURSE_TITLE, installmentStatus, PUBLISHED,
  sessionStatus, studentCurrentStatus,
} from '../../../../../../constants';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

// query to get current component status of user
const getUserCurrentTopicComponentStatus = (userId) => `
  {
  userCurrentTopicComponentStatuses(
    filter: {
      and: [
        { user_some: { id: "${userId}" } }
        {
          currentCourse_some: {
            and: [{ status: ${PUBLISHED} }, { title: "${GLOBAL_COURSE_TITLE}" }]
          }
        }
      ]
    }
  ) {
    id
    currentTopic {
      id
      title
      order
    }
    enrollmentType
  }
}
  `;

// query to get batch status
const getBatchCurrentTopic = (userId) => `
{
  user(id: "${userId}") {
    id
    studentProfile {
      batch {
        id
        currentComponent {
          enrollmentType
          currentTopic {
            id
            order
          }
        }
      }
    }
  }
}
  `;

const getEnrollmentStatusFromPayment = (userId) => `
{
  userPaymentPlans(filter: { user_some: { id: "${userId}" } }) {
    id
    enrollmentStatus
  }
}
`;

const getMenteeSession = (userId) => `
{
  menteeSessions(
    filter: {
      and: [
        { user_some: { id: "${userId}" } }
        { topic_some: { order: 1 } }
      ]
    }
  ) {
    id
  }
}
`;

const getMentorMenteeSession = (menteeSessionId) => `
{
  mentorMenteeSessions(
    filter: { menteeSession_some: { id: "${menteeSessionId}" } }
  ) {
    id
    sessionStatus
  }
}
`;
const getStatus = async (topicOrder, enrollmentType, userId) => {
  const {
    registered, onBoarding, postDemo,
    preDemo, paidUser,
  } = studentCurrentStatus;
  let status = registered;
  if (topicOrder >= 1 && topicOrder <= 3) {
    const menteeSessions = await callLocalGraphqlApi(getMenteeSession(userId));
    const menteeSessionData = get(menteeSessions, 'data.menteeSessions', []);
    // if menteeSession exist for the user, then will get the menteeSessionID and
    // check if the mentorMenteeSession exist and if we are sessionStatus as completed
    if (menteeSessionData && menteeSessionData.length > 0) {
      const mentorMenteeSessions = await callLocalGraphqlApi(getMentorMenteeSession(get(menteeSessionData, '[0].id')));
      const mentorMenteeSessionData = get(mentorMenteeSessions, 'data.mentorMenteeSessions', []);

      if (mentorMenteeSessionData && mentorMenteeSessionData.length > 0
        && get(mentorMenteeSessionData, '[0].sessionStatus') === sessionStatus.completed) {
        if (enrollmentType && enrollmentType === installmentStatus.paid) {
          status = onBoarding;
        } else {
          status = postDemo;
        }
      } else {
        status = preDemo;
      }
    } else {
      status = preDemo;
    }
  } else if (topicOrder > 3) {
    if (enrollmentType && enrollmentType === installmentStatus.paid) {
      status = paidUser;
    } else {
      status = onBoarding;
    }
  }
  return status;
};

const getStudentCurrentStatus = (async (root, params) => {
  const { input } = params;
  const { registered, unRegistered, churned } = studentCurrentStatus;
  if (input && get(input, 'userId')) {
    let studentStatus = registered;
    const enrollmentTypeFromPayment = await callLocalGraphqlApi(getEnrollmentStatusFromPayment(get(input, 'userId')));
    // If we get the enrollment status as downgraded then the student status is churned
    if (enrollmentTypeFromPayment && enrollmentTypeFromPayment.length > 0
      && get(enrollmentTypeFromPayment, '[0].enrollmentStatus') === 'downgraded') {
      studentStatus = churned;
    } else {
      const getBatchTopic = await callLocalGraphqlApi(getBatchCurrentTopic(get(input, 'userId')));
      const getUserTopic = await callLocalGraphqlApi(getUserCurrentTopicComponentStatus(get(input, 'userId')));

      const batchTopicOrder = get(getBatchTopic, 'data.user.studentProfile.batch.currentComponent.currentTopic.order');
      const userTopicOrder = get(getUserTopic, 'data.userCurrentTopicComponentStatuses[0].currentTopic.order');
      const userEnrollmentType = get(getUserTopic, 'data.userCurrentTopicComponentStatuses[0].enrollmentType');
      const batchEnrollmentType = get(getBatchTopic, 'data.user.studentProfile.batch.currentComponent.enrollmentType');

      const combinedEnrollmentType = (userEnrollmentType === 'free' && batchEnrollmentType === 'free') ? 'free' : 'paid';

      // if the batch for the user exists then will check for the topic order from batch current component

      if (batchTopicOrder) {
        studentStatus = getStatus(batchTopicOrder, combinedEnrollmentType, get(input, 'userId'));
      } else {
        // else will check for the topic order from student's current topic
        studentStatus = getStatus(userTopicOrder, userEnrollmentType, get(input, 'userId'));
      }
    }
    return {
      status: studentStatus,
    };
  }
  return {
    status: unRegistered,
  };
});

export default getStudentCurrentStatus;
