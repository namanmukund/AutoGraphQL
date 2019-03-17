import { componentTypes } from '../../../../../../constants';

const CurrentComponentType = `
  enum CurrentComponentType {
      ${componentTypes.video}
      ${componentTypes.message}
      ${componentTypes.practiceQuestion}
      ${componentTypes.quiz}
  }`;

export default CurrentComponentType;
