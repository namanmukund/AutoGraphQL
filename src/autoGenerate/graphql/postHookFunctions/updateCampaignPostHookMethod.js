import { NoSectionExists } from '../../../../constants/errors/db';
import { campaignTypes } from '../../../../constants';
import {
  createBatchSessionsGroupBySection,
  createBatchSessionsGroupByGrade,
  getClassesGroupByGrade,
  fetchAllConnectedSchoolClasses,
  getSectionExists,
  fetchCampaign,
} from './utils/updateCampaignHelperMethods';

/* eslint-disable no-unused-vars */
const updateCampaignPostHookMethod = async (input, params, mutationName, context) => {
  const { id: campaignId, input: campaignInput, classesConnectIds } = params;
  const { batchRules } = campaignInput;

  const campaign = await fetchCampaign(campaignId);
  const courseId = campaign.course.id;
  if (campaign.type === campaignTypes.b2b) {
    if (batchRules && batchRules.batchCreationBasis && classesConnectIds && classesConnectIds.length > 0) {
      const classes = await fetchAllConnectedSchoolClasses(classesConnectIds);
      // here sort the classes based on the batchCreationBasis rules
      if (batchRules.batchCreationBasis === 'grade') {
        // Map, with key = grade, value = array of classes corresponding to that grade
        const classesGroupByGrade = getClassesGroupByGrade(classes);
        await createBatchSessionsGroupByGrade(classesGroupByGrade, campaignId, courseId);
      } else {
        // check if section exists in atleast one of the school classes
        const noSectionExists = getSectionExists(classes);
        if (noSectionExists) {
          throw new NoSectionExists();
        } else {
          // create separate batches for all the schoolClasses
          await createBatchSessionsGroupBySection(classes, campaignId, courseId);
        }
      }
    }
  }
};

export default updateCampaignPostHookMethod;
