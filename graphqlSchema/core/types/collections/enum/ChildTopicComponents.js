import { childTopicComponents } from '../../../../../constants';

const {
  message, practiceQuestion, comicStrip,
} = childTopicComponents;
const ChildTopicComponents = `
  enum ChildTopicComponents {
      ${message}
      ${practiceQuestion}
      ${comicStrip}
  }`;

export default ChildTopicComponents;
