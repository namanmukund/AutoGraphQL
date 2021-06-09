import birdWatchConfig from './birdwatchConfig';

const reduceUniqueFields = (tasks) => {
  const fields = {};
  tasks.forEach((task) => {
    Object.keys(task.fields).forEach((fieldType) => {
      if (fields[fieldType]) {
        fields[fieldType] = { ...fields[fieldType], ...Object.keys(task.fields[fieldType]) };
      } else {
        fields[fieldType] = Object.keys(task.fields[fieldType]);
      }
    });
  });
  return fields;
};

const getParameterValues = async () => {};
const getActionArgument = () => ({});

const birdwatch = async (input, mutationName, context, params) => {
  // console.log(input);
  birdWatchConfig.forEach(async (listener) => {
    if (listener.on.includes(mutationName)) {
      const fields = await getParameterValues(reduceUniqueFields(listener.do), input, params, context);
      listener.do.forEach((task) => {
        const { fields: actionFields, action, ...rest } = task;
        action({ ...getActionArgument(fields, actionFields), ...rest });
      });
    }
  });
};

export default birdwatch;
