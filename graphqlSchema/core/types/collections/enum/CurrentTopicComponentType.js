import { topicTypes } from '../../../../../constants';

const {
  video, message, practiceQuestion, comicStrip, quiz, blockBasedProject, blockBasedPractice,
} = topicTypes;
const CurrentTopicComponentType = `
  enum CurrentTopicComponentType {
      ${video}
      ${message}
      ${practiceQuestion}
      ${comicStrip}
      ${quiz}
      ${blockBasedProject}
      ${blockBasedPractice}
  }`;

export default CurrentTopicComponentType;
