import callGraphqlApi from '../../../../../api/callGraphqlApi';

// query to get learning objective and it's topic order info
const learningObjectiveAndTopicQuery = async learningObjectiveId => `
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
const getLearningObjectiveAndTopicForValidation = async (
  learningObjectiveId,
) => {
  const learningObjectiveAndTopicResult =
    await callGraphqlApi(await learningObjectiveAndTopicQuery(
      learningObjectiveId));
  return learningObjectiveAndTopicResult;
};

export default getLearningObjectiveAndTopicForValidation;
