import { questionTypes } from '../../../../../constants';

const {
  mcq, fibInput, fibBlock, arrange,
} = questionTypes;
const QuestionBankType = `
  enum QuestionBankType {
    ${mcq}
    ${fibInput}
    ${fibBlock}
    ${arrange}
  }`;

export default QuestionBankType;
