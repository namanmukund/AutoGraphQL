import { blockBasedProjectType, childTopicComponents, topicComponents } from '../../../../../constants';

const { comicStrip, chatbot } = childTopicComponents;
const { video } = topicComponents;
const { project, practice } = blockBasedProjectType;
const LearningObjectiveComponentsB2B = `
  enum LearningObjectiveComponentsB2B {
      ${video}
      ${chatbot}
      ${comicStrip}
      ${practice}
      ${project}
  }`;

export default LearningObjectiveComponentsB2B;
