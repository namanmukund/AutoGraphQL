import { childTopicComponents } from '../../../../../constants';

const {
  message, practiceQuestion, comicStrip, chatbot,
} = childTopicComponents;
const LearningObjectiveComponents = `
  enum LearningObjectiveComponents {
      ${message}
      ${practiceQuestion}
      ${comicStrip}
      ${chatbot}
  }`;

export default LearningObjectiveComponents;
