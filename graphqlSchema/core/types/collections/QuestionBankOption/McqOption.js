const McqOption = `
  type McqOption {
   statement: String
   isCorrect: Boolean @defaultValue(value: "false")
   initialXML: String
   blocksJSON: String
   questionBankImage: QuestionBankImage @relation(name: "McqQuestionBankImage", direction: "OneWay")
 }`;

export default McqOption;
