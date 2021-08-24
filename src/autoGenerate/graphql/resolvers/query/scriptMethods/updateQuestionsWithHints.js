import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const fetchQuestions = async () => {
  const query = `
    {
      questionBanks {
        id
        hint
        hints{
          hint
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

const updateQuestionsWithHints = async () => {
  const questions = await fetchQuestions();
  // eslint-disable-next-line no-restricted-syntax
  for (const question of questions) {
    const questionId = question.id;
    const hint = get(question, 'hint');
    const hints = get(question, 'hints', []);
    if (hint && questionId) {
      hints.push({
        hint,
      });
      const variable = {
        input: { hints: { replace: hints } },
      };
      // eslint-disable-next-line no-await-in-loop
      await updateQuestion(questionId, variable);
      // eslint-disable-next-line no-console
      console.log(`>>>>> Updated question id with hints : ${questionId}`);
    }
  }
};

export default updateQuestionsWithHints;
