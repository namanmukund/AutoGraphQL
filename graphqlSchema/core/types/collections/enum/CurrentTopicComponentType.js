import { topicTypes } from '../../../../../constants';

const {
  video, message, practiceQuestion, quiz,
} = topicTypes;
const CurrentTopicComponentType = `
  enum CurrentTopicComponentType {
      ${video}
      ${message}
      ${practiceQuestion}
      ${quiz}
  }`;

export default CurrentTopicComponentType;
