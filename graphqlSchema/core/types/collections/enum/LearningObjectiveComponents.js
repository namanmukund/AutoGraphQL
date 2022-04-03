import { childTopicComponents } from '../../../../../constants';

const {
  message, practiceQuestion, comicStrip, chatbot, learningSlide,
} = childTopicComponents;
const LearningObjectiveComponents = `
  enum LearningObjectiveComponents {
      ${message}
      ${practiceQuestion}
      ${comicStrip}
      ${chatbot}
      ${learningSlide}
  }`;

export default LearningObjectiveComponents;
