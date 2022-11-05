const EvaluationTag = `
  type EvaluationTag @model {
    name: String!
    minStar: Int!
    maxStar: Int!
    category: String
  }
`;

export default EvaluationTag;
