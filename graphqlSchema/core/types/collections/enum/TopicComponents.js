import { topicComponents } from '../../../../../constants';

const {
  video, learningObjective, assignment, quiz, comicStrip, project,
} = topicComponents;
const TopicComponents = `
  enum TopicComponents {
      ${video}
      ${learningObjective}
      ${assignment}
      ${quiz}
      ${comicStrip}
      ${project}
  }`;

export default TopicComponents;
