/* eslint-disable no-console */
/*
  Post hook of add task
*/
const addTaskPostHookMethod = async (input) => {
  const { id: taskId } = input;
  // make sure that task is assiged only based on given conditions
  console.log('taskId', taskId);
};

export default addTaskPostHookMethod;
