import { PUBLISHED } from '../../../constants';
import callGraphqlApi from '../../api/callGraphqlApi';

// query to get first published topic and first published LO corresponding to it
const topicQuery = order => `
  query{
    topics(
      filter:{
        status: ${PUBLISHED}
      }
      orderBy:order_ASC, 
      first: ${order}
    ){
      id
      learningObjectives(filter:{
        status: ${PUBLISHED}
        }
        orderBy: order_ASC
        first: ${order}
      ){
        id
      }
    }
  }
  `;

/*
Getting the first published topic and first published learning objective corresponding to that topic
This will get populated in addUserCurrentTopicComponentStatusMutation
*/
const getFirstTopicAndLearningObjective = async () => {
  const topicQueryResult = await callGraphqlApi(topicQuery(1));
  return topicQueryResult;
};

export default getFirstTopicAndLearningObjective;
