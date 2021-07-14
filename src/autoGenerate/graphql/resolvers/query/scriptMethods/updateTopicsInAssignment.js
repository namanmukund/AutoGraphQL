import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const fetchAssignments = async () => {
  const query = `
          {
            assignmentQuestions{
              id
              topic{
                  id
                }
              }
            }
          `;
  const assignments = await callLocalGraphqlApi(query);
  return get(assignments, 'data.assignmentQuestions', []);
};

const updateTopicInAssignment = async (assignmentId, topicId) => {
  const mutation = `
      mutation{
        updateAssignmentQuestion(id: "${assignmentId}", topicsConnectIds: "${topicId}"){
          id
        }
      }
      `;
  const result = await callLocalGraphqlApi(mutation);
  return get(result, 'data.updateAssignmentQuestion', {});
};

const updateTopicsInAssignment = async () => {
  // eslint-disable-next-line no-await-in-loop
  const assignments = await fetchAssignments();
  // eslint-disable-next-line no-restricted-syntax
  for (const assignment of assignments) {
    const assignmentId = assignment.id;
    const topicId = assignment && assignment.topic && assignment.topic.id;
    if (assignmentId && topicId) {
      // eslint-disable-next-line no-await-in-loop
      await updateTopicInAssignment(assignmentId, topicId);
      // eslint-disable-next-line no-console
      console.log(`>>>>> Updated assignmentId id : ${assignmentId}`);
    }
  }
};
export default updateTopicsInAssignment;
