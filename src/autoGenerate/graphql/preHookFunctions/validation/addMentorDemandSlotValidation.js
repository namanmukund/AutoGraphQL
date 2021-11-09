import { getUserIdandAppNameAfterValidation } from './utils';

const addMentorDemandSlotValidation = async (params, mutationOrQueryName, context) => {
  const userAndAppInfo = getUserIdandAppNameAfterValidation(context);
  const {
    appName,
  } = userAndAppInfo;
  context.appName = appName;
  return true;
};

export default addMentorDemandSlotValidation;
