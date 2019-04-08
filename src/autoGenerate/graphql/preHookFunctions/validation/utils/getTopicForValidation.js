import callGraphqlApi from '../../../../../api/callGraphqlApi';

// query to get topic info
const topicQuery = async topicId => `
  query{
    topic(id:"${topicId}"){
      id
      order
      isTrial
    }
  }
  `;

// quey to get topic info
const getTopicForValidation = async (
  topicId,
) => {
  const topicResult =
    await callGraphqlApi(await topicQuery(
      topicId));
  return topicResult;
};

export default getTopicForValidation;
