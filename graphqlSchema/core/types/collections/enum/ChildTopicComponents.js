import { childTopicComponents } from '../../../../../constants';

const {
  message, practiceQuestion,
} = childTopicComponents;
const ChildTopicComponents = `
  enum ChildTopicComponents {
      ${message}
      ${practiceQuestion}
  }`;

export default ChildTopicComponents;
