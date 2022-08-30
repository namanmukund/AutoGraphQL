const Evaluation = `
    type Evaluation @model {
        star: Int @length(min: 1, max: 5)
        tags: [EvaluationTag] @relation(name: "EvaluationResultTag", direction: "OneWay")
        comment: String
        userPractice: UserBlockBasedPractice @relation(name: "UserBlockBasedPracticeEvaluation")
        userAssignment: UserAssignment @relation(name: "UserAssignmentEvaluation")
    }
`;

export default Evaluation;
