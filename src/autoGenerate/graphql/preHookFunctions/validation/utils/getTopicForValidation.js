import callGraphqlApi from '../../../../../api/callGraphqlApi';

// query to get topic info
const topicQuery = (topicId) => `
  query{
    topic(id:"${topicId}"){
      id
      order
      isTrial
    }
  }
  `;

// quey to get topic info
const getTopicForValidation = (topicId) => callGraphqlApi(topicQuery(
  topicId,
));

export default getTopicForValidation;
