/* eslint-disable no-param-reassign */
import { get } from 'lodash';
import { DatabaseRecordNotFoundError } from '../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

// query to get batchCurrentComponentStatus
const getBatchCurrentComponentQuery = (batchCurrentComponentStatusId) => `
  query{
    batchCurrentComponentStatus(id:"${batchCurrentComponentStatusId}"){
      id
      currentTopic{
        id
        order
      }
      batch{
        allottedMentor{
          id
        }
        students{
          user{
            id
            source
          }
        }
      }
    }
  }
`;

// query to get a topic
const getTopicOrderQuery = (topicId) => `
  query{
      topic(id:"${topicId}"){
        id
        order
        courses{
          id
        }
      }
    }
`;

const updateBatchCurrentComponentStatusValidation = async (params, mutationOrQueryName, context) => {
  const { id: batchCurrentComponentStatusId, currentTopicConnectId } = params;

  const batchCurrentComponentResult = await callLocalGraphqlApi(getBatchCurrentComponentQuery(batchCurrentComponentStatusId));
  const batchCurrentComponentStatusDoc = get(batchCurrentComponentResult, 'data.batchCurrentComponentStatus');

  if (!(batchCurrentComponentStatusDoc && batchCurrentComponentStatusDoc.id)) {
    throw new DatabaseRecordNotFoundError();
  }

  if (currentTopicConnectId) {
    const topicResult = await callLocalGraphqlApi(getTopicOrderQuery(currentTopicConnectId));
    const topicDoc = get(topicResult, 'data.topic');
    // if coursePackage, update current course also
    if (context.usesCoursePackage) {
      params.currentCourseConnectId = get(topicDoc, 'courses[0].id');
    }
    context.batchCurrentComponentStatusDoc = batchCurrentComponentStatusDoc;
    context.topicDoc = topicDoc;
  }
};

export default updateBatchCurrentComponentStatusValidation;
