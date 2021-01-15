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
    // eslint-disable-next-line no-param-reassign
    context.batchCurrentComponentStatusDoc = batchCurrentComponentStatusDoc;
    context.topicDoc = topicDoc;
  }
};

export default updateBatchCurrentComponentStatusValidation;
