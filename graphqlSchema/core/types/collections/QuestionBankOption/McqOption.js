const McqOption = `
  type McqOption {
   statement: String
   isCorrect: Boolean @defaultValue(value: "false")
 }`;

export default McqOption;
