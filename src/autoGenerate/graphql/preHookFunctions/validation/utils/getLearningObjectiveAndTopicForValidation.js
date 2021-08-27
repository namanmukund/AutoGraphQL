import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

// query to get learning objective and it's topic order info
const learningObjectiveAndTopicQuery = (learningObjectiveId, courseId) => `
  query{
    learningObjective(id:"${learningObjectiveId}"){
      id
      order
      topics(filter:{and:[
        ${courseId ? `{courses_some:{id:"${courseId}"}}` : ''}
      ]}) {
        id
        order
        isTrial
      }
      topic{
        id
        order
        isTrial
      }
    }
  }
  `;

// quey to get learning objective and related topic
const getLearningObjectiveAndTopicForValidation = (learningObjectiveId, courseId) => callLocalGraphqlApi(learningObjectiveAndTopicQuery(learningObjectiveId, courseId));

export default getLearningObjectiveAndTopicForValidation;
