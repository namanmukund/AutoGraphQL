import { topicTypes } from '../../../../../constants';

const {
  video, message, practiceQuestion, comicStrip, quiz, blockBasedProject, blockBasedPractice, learningSlide,
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
      ${learningSlide}
  }`;

export default CurrentTopicComponentType;
