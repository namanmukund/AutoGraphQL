import { GLOBAL_COURSE_TITLE, PUBLISHED } from '../../../constants';
import callLocalGraphqlApi from '../../api/callLocalGraphqlApi';

// query to get first published topic and first published LO corresponding to it
const topicQuery = (courseId) => `
  query{
    topics(
      filter:{
        and:[
          {
            status: ${PUBLISHED}
          }
          {
            courses_some:{
              ${courseId ? `id: "${courseId}"` : `title: "${GLOBAL_COURSE_TITLE}"`}
            }
          }
        ]
      }
      orderBy:order_ASC
      first: 1
    ){
      id
      learningObjectives(
        filter:{
          and:[
            {
              status: ${PUBLISHED}
            }
          ]
        }
        orderBy:order_ASC
        first: 1
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
const topicQueryWithExtraInfo = (courseId) => `
  query{
    topics(
      filter:{
        and:[
          {
            status: ${PUBLISHED}
          }
          {
            courses_some:{
              ${courseId ? `id: "${courseId}"` : `title: "${GLOBAL_COURSE_TITLE}"`}
            }
          }
        ]
      }
      orderBy:order_ASC
      first: 1
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
            }
          ]
        }
        orderBy:order_ASC
        first: 1
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
const getFirstTopicAndLearningObjective = async (queryOrMutationName, courseId) => {
  if (queryOrMutationName === 'userCourseSyllabus') {
    return callLocalGraphqlApi(topicQueryWithExtraInfo(courseId));
  }
  return callLocalGraphqlApi(topicQuery(courseId));
};

export default getFirstTopicAndLearningObjective;
