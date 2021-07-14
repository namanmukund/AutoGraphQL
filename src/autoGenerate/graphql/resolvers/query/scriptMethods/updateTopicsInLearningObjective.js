import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const fetchLearningObjectives = async () => {
  const query = `
          {
            learningObjectives{
              id
              topic{
                id
                courses{
                  id
                }
              }
            }
          }
          `;
  const learningObjectives = await callLocalGraphqlApi(query);
  return get(learningObjectives, 'data.learningObjectives', []);
};

const updateTopicInLearningObjective = async (learningObjectiveId, topicId, courseId) => {
  const mutation = `
      mutation{
        updateLearningObjective(id: "${learningObjectiveId}",
         topicsConnectIds: "${topicId}"
         ${courseId ? `coursesConnectIds: "${courseId}"` : ''}
         ){
          id
        }
      }
      `;
  const result = await callLocalGraphqlApi(mutation);
  return get(result, 'data.updateLearningObjective', {});
};

const updateTopicsInLearningObjective = async () => {
  // eslint-disable-next-line no-await-in-loop
  const learningObjectives = await fetchLearningObjectives();
  // eslint-disable-next-line no-restricted-syntax
  for (const learningObjective of learningObjectives) {
    const learningObjectiveId = learningObjective.id;
    const topicId = learningObjective && learningObjective.topic && learningObjective.topic.id;
    const courseId = get(learningObjective, 'topic.courses[0].id', '');
    if (learningObjectiveId && topicId) {
      // eslint-disable-next-line no-await-in-loop
      await updateTopicInLearningObjective(learningObjectiveId, topicId, courseId);
      // eslint-disable-next-line no-console
      console.log(`>>>>> Updated learningObjective id : ${learningObjectiveId}`);
    }
  }
};
export default updateTopicsInLearningObjective;
