import { topicComponents } from '../../../../../constants';

const {
  video, learningObjective, assignment, quiz, blockBasedProject, blockBasedPractice,
} = topicComponents;
const TopicComponents = `
  enum TopicComponents {
      ${video}
      ${learningObjective}
      ${assignment}
      ${quiz}
      ${blockBasedProject}
      ${blockBasedPractice}
  }`;

export default TopicComponents;
