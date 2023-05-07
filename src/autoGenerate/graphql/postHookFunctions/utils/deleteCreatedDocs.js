import { get } from 'lodash';
import { callLocalGraphqlApi } from '../../../../api';

const deleteUserVideo = async (id, context) => {
  const query = `
    mutation{
        deleteUserVideo(
            id: "${id}"
        ){
            id
        }
    }`;
  await callLocalGraphqlApi(query, context);
};

const deleteUserLearningObjective = async (id, context) => {
  const query = `
    mutation{
        deleteUserLearningObjective(
            id: "${id}"
        ){
            id
        }
    }`;
  await callLocalGraphqlApi(query, context);
};

const deleteUserAssignment = async (id, context) => {
  const query = `
    mutation{
        deleteUserAssignment(
            id: "${id}"
        ){
            id
        }
    }`;
  await callLocalGraphqlApi(query, context);
};

const deleteUserBlockBasedPractice = async (id, context) => {
  const query = `
    mutation{
        deleteUserBlockBasedPractice(
            id: "${id}"
        ){
            id
        }
    }`;
  await callLocalGraphqlApi(query, context);
};

const deleteDoc = async (id, mutationName, context) => {
  switch (mutationName) {
    case 'userVideo':
      await deleteUserVideo(id, context);
      break;
    case 'userLearningObjective':
      await deleteUserLearningObjective(id, context);
      break;
    case 'userAssignment':
      await deleteUserAssignment(id, context);
      break;
    case 'blockBasedPractice':
      await deleteUserBlockBasedPractice(id, context);
      break;
    default:
      break;
  }
};

const deleteCreatedDocs = async (mutationName, input, context) => {
  for (let i = 0; i < input.length; i += 1) {
    const id = get(input[i], 'id');
    // eslint-disable-next-line no-await-in-loop
    await deleteDoc(id, mutationName, context);
  }
};

export default deleteCreatedDocs;
