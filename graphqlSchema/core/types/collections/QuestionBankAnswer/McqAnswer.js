const McqAnswer = `
  type McqAnswer {
   statement: String
   isSelected: Boolean @defaultValue(value: "false")
   initialXML: String
   blocksJSON: String
   questionBankImage: QuestionBankImage @relation(name: "McqAnswerBankImage", direction: "OneWay")
 }`;

export default McqAnswer;
