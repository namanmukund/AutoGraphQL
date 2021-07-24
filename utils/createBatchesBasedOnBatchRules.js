import { get, isEqual } from 'lodash';
import { NoSectionExists } from '../constants/errors';
import {
  getSectionExists,
  getClassesGroupByGrade,
  fetchAllConnectedSchoolClasses,
  createBatchForB2B2C,
  createBatchGroupByGrade,
  createBatchGroupBySection,
} from '../src/autoGenerate/graphql/postHookFunctions/utils/updateCampaignHelperMethods';
import extractSlotsFromInput from './extractSlotsFromInput';

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
  } else if (context.prevTimeTableRules && timeTableRules) {
    const prevTimeTableRulesArray = get(context, 'prevTimeTableRules');
    const timeTableRulesArray = get(timeTableRules, 'replace', []);

    // get diff of previous and current timetable rules
    /* eslint-disable arrow-body-style */
    const diff = timeTableRulesArray.filter((obj) => {
      return !prevTimeTableRulesArray.some((obj2) => {
        const { filteredSlots: f1 } = extractSlotsFromInput(obj);
        const { filteredSlots: f2 } = extractSlotsFromInput(obj2);
        return (obj.bookingDate === obj2.bookingDate
          && isEqual(f1, f2)
          && obj.allottedMentorConnectId === obj2.allottedMentorConnectId);
      });
    });

    // if there exists any batches to be made
    if (diff.length > 0) {
      createBatchForB2B2C(diff, campaignId, courseId, context.schoolId, classesConnectIds, context);
    }
  }
};

export {
  createB2BBatchesBasedOnBatchRules,
  createB2B2CEventBatchesBasedOnBatchRules,
};
