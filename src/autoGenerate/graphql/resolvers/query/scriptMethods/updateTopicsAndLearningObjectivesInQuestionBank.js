import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const fetchQuestions = async () => {
  const query = `
          {
            questionBanks{
              id
              topic{
                id
                courses{
                  id
                }
              }
              learningObjective{
                id
              }
            }
          }
          `;
  const questions = await callLocalGraphqlApi(query);
  return get(questions, 'data.questionBanks', []);
};

const updateTopicAndLOInQuestion = async (questionId, learningObjectiveId, topicId, courseId) => {
  const mutation = `
      mutation{
        updateQuestionBank(id: "${questionId}",
          ${learningObjectiveId ? `learningObjectivesConnectIds: "${learningObjectiveId}"` : ''}
          ${topicId ? `topicsConnectIds: "${topicId}"` : ''}
          ${courseId ? `coursesConnectIds: "${courseId}"` : ''}
          ){
            id
        }
      }
      `;
  const result = await callLocalGraphqlApi(mutation);
  return get(result, 'data.updateQuestionBank', {});
};

const updateTopicsAndLearningObjectivesInQuestionBank = async () => {
  // eslint-disable-next-line no-await-in-loop
  const questions = await fetchQuestions();
  // eslint-disable-next-line no-restricted-syntax
  for (const question of questions) {
    const questionId = question.id;
    const learningObjectiveId = question && question.learningObjective && question.learningObjective.id;
    const topicId = question && question.topic && question.topic.id;
    const courseId = get(question, 'topic.courses[0].id', '');
    if (questionId && (learningObjectiveId || topicId)) {
      // eslint-disable-next-line no-await-in-loop
      await updateTopicAndLOInQuestion(questionId, learningObjectiveId, topicId, courseId);
      // eslint-disable-next-line no-console
      console.log(`>>>>> Updated question id : ${questionId}`);
    }
  }
};
export default updateTopicsAndLearningObjectivesInQuestionBank;
