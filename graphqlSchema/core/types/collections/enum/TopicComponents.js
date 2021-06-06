import { topicComponents } from '../../../../../constants';

const {
  video, learningObjective, assignment, quiz, blockBasedProject,
} = topicComponents;
const TopicComponents = `
  enum TopicComponents {
      ${video}
      ${learningObjective}
      ${assignment}
      ${quiz}
      ${blockBasedProject}
  }`;

export default TopicComponents;
