import { get } from "lodash";
import { GLOBAL_COURSE_TITLE, PUBLISHED } from "../../../../../../constants";
import callLocalGraphqlApi from "../../../../../api/callLocalGraphqlApi";

// query to get current component status of user
const getUserCurrentTopicComponentStatus = (userId) => `
  {
  userCurrentTopicComponentStatuses(
    filter: {
      and: [
        { user_some: { id: "${userId}" } }
        {
          currentCourse_some: {
            and: [{ status: ${PUBLISHED} }, { title: ${GLOBAL_COURSE_TITLE} }]
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
`
//  unRegistered
//     registered
//     preDemo
//     postDemo
//     onBoarding
//     paidUser
//     churned
const getStatus = (topicOrder, enrollmentType) => {
  let status = 'registered'
  if (topicOrder === 1) {
    status = 'preDemo' 
  } else if (topicOrder > 1 && topicOrder <= 3) {
    if (enrollmentType && enrollmentType === 'paid') {
      status = 'onBoarding'
    } else {
      status = 'postDemo'
    }
  } else if (topicOrder > 3) {
    status = 'paidUser'
  }
  return status
}

const getStudentCurrentStatus = (async (root, params, context) => {
  const { input } = params
  if (input && get(input, 'userId')) {
    let studentStatus = 'registered'
    const enrollmentTypeFromPayment = await callLocalGraphqlApi(getEnrollmentStatusFromPayment(get(input, 'userId')))
    // If we get the enrollment status as downgraded then the student status is churned
    if (get(enrollmentTypeFromPayment, '[0].enrollmentStatus', 'downgraded') === 'downgraded') {
      studentStatus = 'churned'
    } else {
      const getBatchTopic = await callLocalGraphqlApi(getBatchCurrentTopic(get(input, 'userId')))
      const getUserTopic = await callLocalGraphqlApi(getUserCurrentTopicComponentStatus(get(input, 'userId')))
      const batchTopicOrder = get(getBatchTopic, 'data.user.studentProfile.batch.currentComponent.currentTopic.order')
      const userTopicOrder = get(getUserTopic, 'data.userCurrentTopicComponentStatuses[0].currentTopic.order')
      const userEnrollmentType = get(getUserTopic, 'data.userCurrentTopicComponentStatuses[0].enrollmentType')
      // if the batch for the user exists then will check for the topic order from batch current component
      if (batchTopicOrder) {
        studentStatus = getStatus(batchTopicOrder, userEnrollmentType)
      } else {
        // else will check for the topic order from student's current topic
        studentStatus = getStatus(userTopicOrder, userEnrollmentType)
      }
    }
    return {
      status: studentStatus
    };
  }
  return {
    status: 'unRegistered'
  };
});

export default getStudentCurrentStatus;
