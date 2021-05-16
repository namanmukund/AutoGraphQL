import { NoSectionExists } from '../constants/errors';
import {
  getSectionExists,
  createBatchSessionsGroupBySection,
  createBatchSessionsGroupByGrade,
  getClassesGroupByGrade,
  fetchAllConnectedSchoolClasses,
} from '../src/autoGenerate/graphql/postHookFunctions/utils/updateCampaignHelperMethods';

const createBatchesBasedOnBatchRules = async (campaignId, courseId, batchRules, classesConnectIds) => {
  if (batchRules && batchRules.batchCreationBasis && classesConnectIds && classesConnectIds.length > 0) {
    const classes = await fetchAllConnectedSchoolClasses(classesConnectIds);
    // here sort the classes based on the batchCreationBasis rules
    if (batchRules.batchCreationBasis === 'grade') {
      // Map, with key = grade, value = array of classes corresponding to that grade
      const classesGroupByGrade = getClassesGroupByGrade(classes);
      createBatchSessionsGroupByGrade(classesGroupByGrade, campaignId, courseId);
    } else {
      // check if section exists in atleast one of the school classes
      const noSectionExists = getSectionExists(classes);
      if (noSectionExists) {
        throw new NoSectionExists();
      } else {
        // create separate batches for all the schoolClasses
        createBatchSessionsGroupBySection(classes, campaignId, courseId);
      }
    }
  }
};

export default createBatchesBasedOnBatchRules;
