const McqOption = `
  type McqOption {
   statement: String
   isCorrect: Boolean @defaultValue(value: "false")
   initialXML: String
   blocksJSON: String
 }`;

export default McqOption;
