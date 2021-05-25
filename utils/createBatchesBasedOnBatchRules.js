import { get } from 'lodash';
import { NoSectionExists } from '../constants/errors';
import {
  getSectionExists,
  getClassesGroupByGrade,
  fetchAllConnectedSchoolClasses,
  createBatchForB2B2C,
  createBatchGroupByGrade,
  createBatchGroupBySection,
} from '../src/autoGenerate/graphql/postHookFunctions/utils/updateCampaignHelperMethods';

const createB2BBatchesBasedOnBatchRules = async (campaignId, courseId, batchRules, classesConnectIds, campaignSchoolId) => {
  if (batchRules && batchRules.batchCreationBasis && classesConnectIds && classesConnectIds.length > 0) {
    const classes = await fetchAllConnectedSchoolClasses(classesConnectIds);
    // here sort the classes based on the batchCreationBasis rules
    if (batchRules.batchCreationBasis === 'grade') {
      // Map, with key = grade, value = array of classes corresponding to that grade
      const classesGroupByGrade = getClassesGroupByGrade(classes);
      createBatchGroupByGrade(classesGroupByGrade, campaignId, courseId, campaignSchoolId);
    } else {
      // check if section exists in atleast one of the school classes
      const noSectionExists = getSectionExists(classes);
      if (noSectionExists) {
        throw new NoSectionExists();
      } else {
        // create separate batches for all the schoolClasses
        createBatchGroupBySection(classes, campaignId, courseId);
      }
    }
  }
};

const createB2B2CEventBatchesBasedOnBatchRules = async (campaignId, courseId, batchRules, timeTableRules, schoolId, classesConnectIds, context) => {
  if (batchRules && timeTableRules && schoolId) {
    const timeTableRulesArray = get(timeTableRules, 'replace', []);
    createBatchForB2B2C(timeTableRulesArray, campaignId, courseId, schoolId, classesConnectIds, context);
  }
};

export {
  createB2BBatchesBasedOnBatchRules,
  createB2B2CEventBatchesBasedOnBatchRules,
};
