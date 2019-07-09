const SkipVideo = `
  type SkipVideo {
    learningObjective: LearningObjective @relation(name: "LearningObjectiveSkipVideo", direction: "OneWay")
  }
`;

export default [SkipVideo];
