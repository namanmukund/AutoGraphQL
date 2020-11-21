import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const topicInfoQuery = (topicId) => `
  query{
    topic(id:"${topicId}"){
      id
      order
      title
      thumbnailSmall {
        uri
      }
    }
  }
`;

const getTopicInfo = async (topicId) => {
  const topicInfo = await callLocalGraphqlApi(topicInfoQuery(topicId));
  return topicInfo;
};

export default getTopicInfo;
