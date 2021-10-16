import { topicComponents } from '../../../../../constants';

const {
  video, learningObjective, assignment, quiz, blockBasedProject,
  blockBasedPractice, homeworkAssignment, homeworkPractice,
} = topicComponents;
const TopicComponents = `
  enum TopicComponents {
      ${video}
      ${learningObjective}
      ${assignment}
      ${quiz}
      ${blockBasedProject}
      ${blockBasedPractice}
      ${homeworkAssignment}
      ${homeworkPractice}
  }`;

export default TopicComponents;
