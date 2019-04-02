import { questionTypes } from '../../../../../../constants';

const QuestionBankType = `
  enum QuestionBankType {
    ${questionTypes.mcq}
    ${questionTypes.fibInput}
    ${questionTypes.fibBlock}
    ${questionTypes.arrange}
  }`;

export default QuestionBankType;
