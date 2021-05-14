import { NoSectionExists } from '../../../../constants/errors/db';
import {
  createBatchSessionsGroupBySection,
  createBatchSessionsGroupByGrade,
  getClassesGroupByGrade,
  fetchAllConnectedSchoolClasses,
  getSectionExists,
} from './utils/updateCampaignHelperMethods';

const updateCampaignPostHookMethod = async (input, params, mutationName, context) => {
  const { id: campaignId, input: campaignInput, classesConnectIds } = params;
  const { batchRules } = campaignInput;

  if (batchRules && batchRules.batchCreationBasis.length > 0 && classesConnectIds && classesConnectIds.length > 0) {
    const classes = await fetchAllConnectedSchoolClasses(classesConnectIds);

    // here sort the classes based on the batchCreationBasis rules 
    if (batchRules.batchCreationBasis === 'grade') {

      // Map, with key = grade, value = array of classes corresponding to that grade
      const classesGroupByGrade = getClassesGroupByGrade(classes);
      await createBatchSessionsGroupByGrade(classesGroupByGrade, campaignId);
    } else {

      // check if section exists in atleast one of the school classes
      const noSectionExists = getSectionExists(classes);
      if (noSectionExists) {
        throw new NoSectionExists();
      } else {

        // create separate batches for all the schoolClasses
        await createBatchSessionsGroupBySection(classes, campaignId);
      }
    }
  }
};

export default updateCampaignPostHookMethod;
