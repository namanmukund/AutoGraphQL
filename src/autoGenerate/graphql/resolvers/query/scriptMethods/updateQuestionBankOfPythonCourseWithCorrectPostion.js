import { get } from 'lodash';
import { OLD_COURSE_ID } from '../../../../../../constants';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const getQuestionBanks = async () => {
  const query = `{
  questionBanks(
    filter: {
      and: [
        { questionType: arrange }
        { courses_some: { id: "${OLD_COURSE_ID}" } }
      ]
    }
  ) {
    id
    arrangeOptions {
      displayOrder
      statement
      correctPosition
      correctPositions
    }
  }
}
`;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.questionBanks', []);
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

const updateQuestionBankOfPythonCourseWithCorrectPostion = async () => {
  const questionBanks = await getQuestionBanks();
  if (questionBanks && questionBanks.length > 0) {
    // eslint-disable-next-line no-restricted-syntax
    for (const question of questionBanks) {
      const questionId = question.id;
      const arrangeOptions = get(question, 'arrangeOptions', []);
      const newArrangeOptions = [];
      arrangeOptions.forEach((arrange) => {
        let correctPosition = get(arrange, 'correctPosition', 0);
        const correctPositions = get(arrange, 'correctPositions', []);
        const statement = get(arrange, 'statement');
        const displayOrder = get(arrange, 'displayOrder');
        if (!correctPosition && correctPositions.length > 0) {
          correctPosition = correctPositions[0];
        }
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
  }
};

export default updateQuestionBankOfPythonCourseWithCorrectPostion;
