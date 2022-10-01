import { childTopicComponents, topicTypes } from '../../../../../constants';

const {
  video, message, practiceQuestion, comicStrip, quiz, blockBasedProject, blockBasedPractice, learningSlide,
} = topicTypes;

const { chatbot } = childTopicComponents;

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
      ${chatbot}
  }`;

export default CurrentTopicComponentType;
