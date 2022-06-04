/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
import { get } from 'lodash';
import { callLocalGraphqlApi } from '../../../../../api';

const getClassroomOrBatchDetails = async (classroomTitle, batchId, latestTopicOrder, schoolName) => {
  const query = `
  {
    batches(filter:{
      and: [
        { school_some: { name: "${schoolName}" } }
        ${classroomTitle ? `{classroomTitle_contains: "${classroomTitle}"}` : `{id: "${batchId}"}`}
      ]
    }) {
      id
      code
      classroomTitle
      coursePackage {
        id 
        topics {
          order
          topic {
            id
            order
            courses {
              id
            }
          }
        }
      }
      course {
        id
        topics(filter:{
          and:[
            { status: published }
            { order: ${latestTopicOrder} }
          ]
        }) {
          id 
          order
          title
        }
      }
      currentComponent {
        id
      }
    }
  }
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.batches.0');
};

const getPreviousBatchSessions = async (classroomTitle, batchId) => {
  const query = `
    { 
      batchSessions(filter:{
        and: [
          {batch_some:{
            ${classroomTitle ? `classroomTitle: "${classroomTitle}"` : `id: "${batchId}"`}
          }}
          { sessionStatus_not: completed }
        ]
      }) {
        id
        sessionStatus
        topic {
          id
          order
        }
      }
    }
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.batchSessions', []);
};

// mutation to update BatchCurrentComponentStatus
const updateBatchCurrentComponentStatus = async (
  id,
  currentTopicId,
  currentCourseId,
) => {
  const query = `
  mutation{
    updateBatchCurrentComponentStatus(
      id:"${id}",
      currentTopicConnectId: "${currentTopicId}"
      currentCourseConnectId: "${currentCourseId}"
      input: {}
    ){
      id
    }
  }
  `;
  await callLocalGraphqlApi(query);
};

// mutation to update batchSession
const updateBatchSession = async (
  id,
) => {
  const query = `
  mutation{
    updateBatchSession(
      id:"${id}",
      input: { sessionStatus: completed }
    ){
      id
    }
  }
  `;
  await callLocalGraphqlApi(query);
};

const advanceBatchCurrentSessionMutationResolver = async (
  root,
  params,
) => {
  /*
  Calling method to validate token and return userId.
  we will compare this userId against userId passed in input
  both should be equal to perform further action
  */
  const {
    schoolName, latestTopicOrder, batchId, classroomTitle,
  } = params;
  if (schoolName && !classroomTitle) {
    throw new Error('Classroom Title required!');
  }

  let currentCourseId = '';
  let currentTopicId = '';
  const classroomOrBatch = await getClassroomOrBatchDetails(classroomTitle, batchId, latestTopicOrder, schoolName);
  try {
    if (classroomOrBatch) {
      const coursePackage = get(classroomOrBatch, 'coursePackage');
      if (coursePackage) {
        const latestTopic = (get(coursePackage, 'topics') || []).find((topicRule) => get(topicRule, 'order') === latestTopicOrder);
        currentTopicId = get(latestTopic, 'topic.id');
        currentCourseId = get(latestTopic, 'topic.courses.0.id');
      } else {
        const latestTopic = get(classroomOrBatch, 'course.topics', []).find((topicRule) => get(topicRule, 'order') === latestTopicOrder);
        currentTopicId = get(latestTopic, 'id');
        currentCourseId = get(classroomOrBatch, 'course.id');
      }

      await updateBatchCurrentComponentStatus(get(classroomOrBatch, 'currentComponent.id'), currentTopicId, currentCourseId);

      const batchSessions = await getPreviousBatchSessions(classroomTitle, batchId);
      let previousSessions = [];
      if (coursePackage) {
        previousSessions = batchSessions.filter((session) => {
          const filteredTopic = get(coursePackage, 'topics', []).find((el) => get(el, 'topic.id') === session.topic.id);
          const currentTopicOrder = get(filteredTopic, 'order');
          if (currentTopicOrder && (currentTopicOrder < latestTopicOrder)) {
            return true;
          }
          return false;
        });
      } else {
        previousSessions = batchSessions.filter((el) => get(el, 'topic.order') < latestTopicOrder);
      }
      for (const previousSession of previousSessions) {
        if (previousSession && previousSession.id) {
          await updateBatchSession(previousSession.id);
        }
      }
    }
    return {
      result: true,
    };
  } catch (e) {
    return {
      result: false,
      error: e,
    };
  }
};

export default advanceBatchCurrentSessionMutationResolver;
