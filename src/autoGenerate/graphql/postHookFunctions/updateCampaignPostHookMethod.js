import { get } from 'lodash';
import { campaignTypes, batchCreationStatus } from '../../../../constants';
import { createB2BBatchesBasedOnBatchRules, createB2B2CEventBatchesBasedOnBatchRules } from '../../../../utils/createBatchesBasedOnBatchRules';

/* eslint-disable no-unused-vars */
const updateCampaignPostHookMethod = async (input, params, mutationName, context) => {
  const { id: campaignId, input: campaignInput } = params;
  let { classesConnectIds } = params;
  const { timeTableRules } = campaignInput;
  let { batchRules } = campaignInput;

  const courseId = get(input, 'course.typeId');
  const coursePackageId = get(input, 'coursePackage.typeId');
  const schoolId = get(input, 'school.typeId');

  const prevBatchCreationStatus = get(context, 'prevBatchCreationStatus');
  const type = get(input, 'type');

  if (!batchRules || (batchRules && !batchRules.batchSize)) {
    batchRules = get(input, 'batchRules');
  }

  if (!classesConnectIds || (classesConnectIds && !classesConnectIds.length)) {
    const classes = get(input, 'classes', []);
    classesConnectIds = [];
    /* eslint-disable no-restricted-syntax */
    for (const singleClass of classes) {
      classesConnectIds.push(get(singleClass, 'typeId'));
    }
  }

  // update campaign only when campaign type is b2b and batch creation status is todo
  if (type === campaignTypes.b2b && prevBatchCreationStatus === batchCreationStatus.todo) {
    createB2BBatchesBasedOnBatchRules(campaignId, courseId, batchRules, classesConnectIds, schoolId, coursePackageId);
  } else if (type === campaignTypes.b2b2cEvent) {
    createB2B2CEventBatchesBasedOnBatchRules(campaignId, courseId, batchRules, timeTableRules, schoolId, classesConnectIds, context, coursePackageId);
  }
};

export default updateCampaignPostHookMethod;
