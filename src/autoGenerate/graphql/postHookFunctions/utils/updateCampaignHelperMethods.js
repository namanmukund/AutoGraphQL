import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callGraphqlApi';
import { batchType, batchCreationStatus, ADD_BATCH_TRY_LIMIT } from '../../../../../constants';
import { log } from '../../../../../utils';
import getSelectedSlotsTime from '../../preHookFunctions/validation/utils/getSelectedSlotsTime';

const fetchSchoolClasses = async (schoolClassIds) => {
  const schoolClassIdsString = JSON.stringify(schoolClassIds);
  const query = `
          {
            schoolClasses(filter: {id_in: ${schoolClassIdsString}}){
              id
              grade
              section
              school{
                id
              }
              students{
                id
              }
            }
          }
          `;
  const schoolClasses = await callLocalGraphqlApi(query);
  return get(schoolClasses, 'data.schoolClasses', []);
};

const fetchLastBatchCode = async () => {
  const query = `
          {
            batches(filter:{type:${batchType.b2b}},first:1, orderBy:createdAt_DESC){
              code
            }
          }
          `;
  const lastBatch = await callLocalGraphqlApi(query);
  return get(lastBatch, 'data.batches', []);
};

// query to fetch school code
const fetchSchoolCode = (schoolId) => `
  query{
    school(id: "${schoolId}") {
      id
      code
    }
  }
  `;

const getSectionFilterQuery = (section) => {
  if (section && section.length > 0) {
    return `{classes_some: {section: ${section}}}`;
  }
  return '';
};

const fetchExisitingBatchForGivenData = async (grade, section, schoolId) => {
  const query = `
          {
            batches(filter: {
              and: [
                {classes_some: {grade: ${grade}}}
                ${getSectionFilterQuery(section)}
                {school_some: {id: "${schoolId}"}}
              ]
            },
            orderBy:createdAt_DESC
            ){
              id
              classes{
                id
              }
              school{
                id
              }
              students{
                id
              }
            }
          }
          `;
  const exisitingBatches = await callLocalGraphqlApi(query);
  return get(exisitingBatches, 'data.batches', []);
};

const fetchAllConnectedSchoolClasses = async (classesConnectIds) => {
  const data = await fetchSchoolClasses(classesConnectIds);
  return data;
};

const updateBatchCreationStatus = async (campaignId, status) => {
  const mutation = `
            mutation{
                  updateCampaign(id: "${campaignId}",
                  input:{
                    batchCreationStatus: ${status}
                  }
                  ){
                    id
                    batchCreationStatus
                  }
                }
                `;
  const updateCampaignResponse = await callLocalGraphqlApi(mutation);
  return get(updateCampaignResponse, 'data.updateCampaign', {});
};

const createB2B2CBatch = async (batchCode, schoolId, campaignId, courseId, bookingDate, selectedSlot, allottedMentorConnectId, mentorSessionConnectId) => {
  const mutation = `
            mutation{
                addBatch(input: {
                  code: "${batchCode}",
                  type: ${batchType.b2b2c},
                  b2b2ctimeTable:{
                    bookingDate: "${bookingDate}",
                    ${selectedSlot}: true,
                    mentorSessionConnectId: "${mentorSessionConnectId}"
                  }
                }, schoolConnectId:"${schoolId}",
                  campaignConnectId:"${campaignId}",
                  allottedMentorConnectId:"${allottedMentorConnectId}",
                  courseConnectId: "${courseId}") {
                  id
                  course {
                    createdAt
                    updatedAt
                  }
                  code
                  type
                  description
                  studentsMeta {
                    count
                  }
                  allottedMentor {
                    name
                  }
                  currentComponent {
                    currentTopic {
                      title
                      order
                    }
                  }
                }
              }
                `;
  const addBatchResponse = await callLocalGraphqlApi(mutation);
  return get(addBatchResponse, 'data.addBatch', {});
};

const createB2BBatch = async (batchCode, schoolId, classIds, campaignId, studentIds, courseId) => {
  const classIdsString = JSON.stringify(classIds);
  const studentIdsString = JSON.stringify(studentIds);
  const mutation = `
            mutation{
                addBatch(input: {
                  code: "${batchCode}",
                  type: ${batchType.b2b},
                }, schoolConnectId:"${schoolId}", classesConnectIds:${classIdsString}, campaignConnectId:"${campaignId}", studentsConnectIds:${studentIdsString}, courseConnectId: "${courseId}") {
                  id
                  course {
                    createdAt
                    updatedAt
                  }
                  code
                  type
                  description
                  studentsMeta {
                    count
                  }
                  allottedMentor {
                    name
                  }
                  currentComponent {
                    currentTopic {
                      title
                      order
                    }
                  }
                }
              }
                `;
  const addBatchResponse = await callLocalGraphqlApi(mutation);
  return get(addBatchResponse, 'data.addBatch', {});
};

const updateB2BBatch = async (existingBatchId, classIds, campaignId, studentIds, courseId) => {
  const classIdsString = JSON.stringify(classIds);
  const studentIdsString = JSON.stringify(studentIds);
  const mutation = `
            mutation{
                updateBatch(
                  id: ${existingBatchId},
                  classesConnectIds:${classIdsString},
                  campaignConnectId:"${campaignId}",
                  studentsConnectIds:${studentIdsString},
                  courseConnectId: "${courseId}",
                  input: {
                    type: ${batchType.b2b},
                  }){
                  id
                  course {
                    createdAt
                    updatedAt
                  }
                  code
                  type
                  description
                  studentsMeta {
                    count
                  }
                  allottedMentor {
                    name
                  }
                  currentComponent {
                    currentTopic {
                      title
                      order
                    }
                  }
                }
              }
                `;
  const updateBatchResponse = await callLocalGraphqlApi(mutation);
  return get(updateBatchResponse, 'data.updateBatch', {});
};

const getClassesGroupByGrade = (classes) => {
  const classesMap = new Map();
  classes.forEach((schoolClass) => {
    if (classesMap.has(schoolClass.grade)) {
      const arr = classesMap.get(schoolClass.grade);
      arr.push(schoolClass);
      classesMap.set(schoolClass.grade, arr);
    } else {
      const arr = [];
      arr.push(schoolClass);
      classesMap.set(schoolClass.grade, arr);
    }
  });
  return classesMap;
};

const createBatchSessionsGroupByGrade = async (classesGroupByGrade, campaignId, courseId) => {
  // classIds and studentIds to pass in input
  let classIds = [];
  let studentIds = [];
  // handle the batch code increments
  const lastBatchCodeRes = await fetchLastBatchCode();
  const lastBatchCode = lastBatchCodeRes && lastBatchCodeRes.length && lastBatchCodeRes[0].code;
  let numeric = Number(lastBatchCode.substring(6));

  // update batchCreation status to in-progress
  await updateBatchCreationStatus(campaignId, batchCreationStatus.inProgress);

  /* eslint-disable no-restricted-syntax */
  for (const grade of classesGroupByGrade.keys()) {
    const classesInGrade = classesGroupByGrade.get(grade);
    const schoolId = classesInGrade[0].school.id;

    /* eslint-disable no-loop-func */
    classesInGrade.forEach((schoolClass) => {
      classIds.push(schoolClass.id);
      if (schoolClass.students && schoolClass.students.length > 0) {
        schoolClass.students.forEach((student) => {
          studentIds.push(student.id);
        });
      }
    });

    // if previosly present batch exists
    /* eslint-disable no-await-in-loop */
    const exisitingBatches = await fetchExisitingBatchForGivenData(grade, null, schoolId);
    if (exisitingBatches && exisitingBatches.length > 0) {
      // update exisiting batch
      const existingBatchId = get(exisitingBatches[0], 'id', '');
      /* eslint-disable no-await-in-loop */
      await updateB2BBatch(existingBatchId, classIds, campaignId, studentIds, courseId);
    } else {
      // tries batchCodes on fail for max. 5 times before moving on
      /* eslint-disable no-await-in-loop */
      let batchCode = `TK-BBS${numeric += 1}`;
      for (let i = 0; i < ADD_BATCH_TRY_LIMIT; i += 1) {
        try {
          await createB2BBatch(batchCode, schoolId, classIds, campaignId, studentIds, courseId);
          log(`Batch ${batchCode} added`);
          break;
        } catch (err) {
          log(`Batch ${batchCode} not added. Trying next batch code.`);
          batchCode = `TK-BBS${numeric += 1}`;
        }
      }
    }
    classIds = [];
    studentIds = [];
  }
  // update batchCreation status to complete
  await updateBatchCreationStatus(campaignId, batchCreationStatus.complete);
  // update batchCreation status to complete
  await updateBatchCreationStatus(campaignId, batchCreationStatus.complete);
};

const createBatchSessionsGroupBySection = async (classes, campaignId, courseId) => {
  // classIds and studentIds to pass in input
  let studentIds = [];
  // handle the batch code increments
  const lastBatchCodeRes = await fetchLastBatchCode();
  const lastBatchCode = lastBatchCodeRes && lastBatchCodeRes.length && lastBatchCodeRes[0].code;
  let numeric = Number(lastBatchCode.substring(6));

  const schoolId = classes[0].school.id;

  // update batchCreation status to in-progress
  await updateBatchCreationStatus(campaignId, batchCreationStatus.inProgress);

  for (let i = 0; i < classes.length; i += 1) {
    if (classes[i].students && classes[i].students.length > 0) {
      classes[i].students.forEach((student) => {
        studentIds.push(student.id);
      });
    }

    const gradeToCheck = get(classes[i], 'grade', '');
    const sectionToCheck = get(classes[i], 'section', '');

    if (gradeToCheck.length > 0 && sectionToCheck.length > 0) {
      // if previously present batch exists
      /* eslint-disable no-await-in-loop */
      const exisitingBatches = await fetchExisitingBatchForGivenData(classes[i].grade, classes[i].section, schoolId);
      if (exisitingBatches && exisitingBatches.length > 0) {
        // update exisiting batch
        const existingBatchId = get(exisitingBatches[0], 'id', '');
        /* eslint-disable no-await-in-loop */
        await updateB2BBatch(existingBatchId, classes[i].id, campaignId, studentIds, courseId);
      }
    } else {
      let batchCode = `TK-BBS${numeric += 1}`;
      /* eslint-disable no-await-in-loop */
      // tries batchCodes on fail for max. 5 times before moving on
      for (let j = 0; j < ADD_BATCH_TRY_LIMIT; j += 1) {
        try {
          await createB2BBatch(batchCode, schoolId, classes[i].id, campaignId, studentIds, courseId);
          log(`Batch ${batchCode} added`);
          break;
        } catch (err) {
          log(`Batch ${batchCode} not added. Trying next batch code.`);
          batchCode = `TK-BBS${numeric += 1}`;
        }
      }
    }
    studentIds = [];
  }
  // update batchCreation status to complete
  await updateBatchCreationStatus(campaignId, batchCreationStatus.complete);
  return true;
};

const getSectionExists = (classes) => {
  let noSectionInAnyClass = true;
  /* eslint-disable no-loop-func */
  classes.forEach((schoolClass) => {
    /* eslint-disable consistent-return */
    if (schoolClass.section && schoolClass.section != null) {
      noSectionInAnyClass = false;
      return noSectionInAnyClass;
    }
    return true;
  });
  return noSectionInAnyClass;
};

const createBatchForB2B2C = async (timeTableRules, campaignId, courseId, schoolId) => {
  // update batchCreation status to in-progress
  await updateBatchCreationStatus(campaignId, batchCreationStatus.inProgress);
  // handle the batch code increments
  const schoolCodeRes = await callLocalGraphqlApi(fetchSchoolCode(schoolId));
  const schoolCode = get(schoolCodeRes, 'data.school.code', '');

  let numeric = 1;
  /* eslint-disable no-restricted-syntax */
  for (const timeTableRule of timeTableRules) {
    const {
      bookingDate, mentorSession, allottedMentor, ...slots
    } = timeTableRule;
    const selectedSlots = getSelectedSlotsTime(slots);
    const formattedBookingDate = new Date(bookingDate);
    formattedBookingDate.setHours(0, 0, 0, 0);
    const selectedSlot = `slot${selectedSlots[0]}`;
    const allottedMentorConnectId = get(allottedMentor, 'typeId', '');
    const mentorSessionConnectId = get(mentorSession, 'typeId', '');
    let batchCode = `${schoolCode}-BCS${numeric}`;
    for (let i = 0; i < ADD_BATCH_TRY_LIMIT; i += 1) {
      try {
        await createB2B2CBatch(batchCode, schoolId, campaignId, courseId, formattedBookingDate.toISOString(), selectedSlot, allottedMentorConnectId, mentorSessionConnectId);
        numeric += 1;
        log(`Batch ${batchCode} added`);
        break;
      } catch (err) {
        log(`Batch ${batchCode} not added. Trying next batch code.`);
        batchCode = `${schoolCode}-BCS${numeric += 1}`;
      }
    }
  }
  // update batchCreation status to complete
  await updateBatchCreationStatus(campaignId, batchCreationStatus.complete);
  return true;
};

export {
  createBatchSessionsGroupBySection,
  createBatchSessionsGroupByGrade,
  getClassesGroupByGrade,
  fetchAllConnectedSchoolClasses,
  getSectionExists,
  createBatchForB2B2C,
};
