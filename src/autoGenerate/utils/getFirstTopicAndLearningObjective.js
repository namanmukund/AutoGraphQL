import { PUBLISHED } from '../../../constants';
import callLocalGraphqlApi from '../../api/callLocalGraphqlApi';

// query to get first published topic and first published LO corresponding to it
const topicQuery = (order) => `
  query{
    topics(
      filter:{
        and:[
          {
            status: ${PUBLISHED}
          },{
             order: ${order}
          }
        ]
      }
    ){
      id
      learningObjectives(
        filter:{
          and:[
            {
              status: ${PUBLISHED}
            },{
               order: ${order}
            }
          ]
        }
      ){
        id
      }
    }
  }
  `;

/*
query to get first published topic and first published LO corresponding to it
along with info about topic and LO. this will be sent when a not logged in user
calls userCourseSyllabus
*/
const topicQueryWithExtraInfo = (order) => `
  query{
    topics(
      filter:{
        and:[
          {
            status: ${PUBLISHED}
          },{
             order: ${order}
          }
        ]
      }
    ){
      id
      title
      description
      videoTitle
      videoDescription
      videoThumbnail{
        id
        name
        uri
      }
      order
      thumbnail{
        id
        name
        uri
      }
      description
      learningObjectives(
        filter:{
          and:[
            {
              status: ${PUBLISHED}
            },{
               order: ${order}
            }
          ]
        }
      ){
        id
        title
        description
        thumbnail{
          id
          uri
          name
        }
      }
    }
  }
  `;

/*
Getting the first published topic and first published learning objective corresponding to that topic
This will get populated in addUserCurrentTopicComponentStatusMutation
*/
const getFirstTopicAndLearningObjective = async (queryOrMutationName) => {
  if (queryOrMutationName === 'userCourseSyllabus') {
    return callLocalGraphqlApi(topicQueryWithExtraInfo(1));
  }
  return callLocalGraphqlApi(topicQuery(1));
};

export default getFirstTopicAndLearningObjective;
