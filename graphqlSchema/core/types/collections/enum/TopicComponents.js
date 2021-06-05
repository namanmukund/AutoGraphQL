import { topicComponents } from '../../../../../constants';

const {
  video, learningObjective, assignment, quiz, blockTypeProject,
} = topicComponents;
const TopicComponents = `
  enum TopicComponents {
      ${video}
      ${learningObjective}
      ${assignment}
      ${quiz}
      ${blockTypeProject}
  }`;

export default TopicComponents;
