import callGraphqlApi from '../../../../../api/callGraphqlApi';

// query to get learning objective and it's topic order info
const learningObjectiveAndTopicQuery = learningObjectiveId => `
  query{
    learningObjective(id:"${learningObjectiveId}"){
      id
      order
      topic{
        id
        order
        isTrial
      }
    }
  }
  `;

// quey to get learning objective and related topic
const getLearningObjectiveAndTopicForValidation = learningObjectiveId =>
  callGraphqlApi(learningObjectiveAndTopicQuery(learningObjectiveId));

export default getLearningObjectiveAndTopicForValidation;
