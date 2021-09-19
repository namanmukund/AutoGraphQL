import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const fetchQuestions = async () => {
  const query = `
    {
      questionBanks(filter: { questionType: arrange }) {
        id
        arrangeOptions {
          displayOrder
          statement
          correctPosition
          correctPositions
        }
      }
    }`;
  const questions = await callLocalGraphqlApi(query);
  return get(questions, 'data.questionBanks', []);
};

const updateQuestion = async (questionId, variable) => {
  const mutation = `
    mutation($input: QuestionBankUpdate) {
        updateQuestionBank(id: "${questionId}", input: $input) {
            id
        }
    }`;
  const result = await callLocalGraphqlApi(mutation, '', variable);
  return get(result, 'data.updateQuestionBank', {});
};

const updateQuestionsWithCorrectPositionIndex = async () => {
  const questions = await fetchQuestions();
  // eslint-disable-next-line no-restricted-syntax
  for (const question of questions) {
    const questionId = question.id;
    const arrangeOptions = get(question, 'arrangeOptions', []);
    const newArrangeOptions = [];
    arrangeOptions.forEach((arrange) => {
      const correctPosition = get(arrange, 'correctPosition');
      const correctPositions = get(arrange, 'correctPositions', []).map((position) => position + 1);
      const statement = get(arrange, 'statement');
      const displayOrder = get(arrange, 'displayOrder');
      newArrangeOptions.push({
        correctPosition,
        correctPositions,
        displayOrder,
        statement,
      });
    });
    if (questionId) {
      const variable = {
        input: { arrangeOptions: { replace: newArrangeOptions } },
      };
      // eslint-disable-next-line no-await-in-loop
      await updateQuestion(questionId, variable);
      // eslint-disable-next-line no-console
      console.log(`>>>>> Updated question id with arrangeOptions : ${questionId}`);
    }
  }
};

export default updateQuestionsWithCorrectPositionIndex;
