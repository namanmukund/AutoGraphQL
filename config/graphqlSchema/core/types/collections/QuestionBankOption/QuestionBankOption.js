const QuestionBankOption = `
  type QuestionBankOption {
   statement: String!
   explanation: String
   isCorrect: Boolean @defaultValue(value: "false")
 }`;

export default QuestionBankOption;
