const McqAnswer = `
  type McqAnswer {
   statement: String
   isSelected: Boolean @defaultValue(value: "false")
 }`;

export default McqAnswer;
