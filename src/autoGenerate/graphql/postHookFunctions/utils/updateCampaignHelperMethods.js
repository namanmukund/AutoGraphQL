import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callGraphqlApi';
import { batchType, batchCreationStatus, ADD_BATCH_TRY_LIMIT } from '../../../../../constants';
import { log } from '../../../../../utils';

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

const fetchCampaign = async (campaignId) => {
  const query = `
            {
              campaign(id: "${campaignId}"){
                type
                course{
                  title
                }
                batchCreationStatus
              }
            }
            `;
  const campaign = await callLocalGraphqlApi(query);
  return get(campaign, 'data.campaign', {});
};

const fetchLastBatchSession = async () => {
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

const createBatch = async (batchCode, schoolId, classIds, campaignId, studentIds, courseId) => {
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
  const lastBatchSession = await fetchLastBatchSession();
  const lastBatchSessionCode = lastBatchSession[0].code;
  let numeric = Number(lastBatchSessionCode.substring(6));

  // update batchCreation status to in-progress
  await updateBatchCreationStatus(campaignId, batchCreationStatus.inProgress);

  /* eslint-disable no-restricted-syntax */
  for (const grade of classesGroupByGrade.keys()) {
    const classesInGrade = classesGroupByGrade.get(grade);
    const schoolId = classesInGrade[0].school.id;
    let batchCode = `TK-BBS${numeric += 1}`;
    /* eslint-disable no-loop-func */
    classesInGrade.forEach((schoolClass) => {
      classIds.push(schoolClass.id);
      if (schoolClass.students && schoolClass.students.length > 0) {
        schoolClass.students.forEach((student) => {
          studentIds.push(student.id);
        });
      }
    });

    /* eslint-disable no-await-in-loop */
    // tries batchCodes on fail for max. 5 times before moving on
    for (let i = 0; i < ADD_BATCH_TRY_LIMIT; i += 1) {
      try {
        await createBatch(batchCode, schoolId, classIds, campaignId, studentIds, courseId);
        log(`Batch ${batchCode} added`);
        break;
      } catch (err) {
        log(`Batch ${batchCode} not added. Trying next batch code.`);
        batchCode = `TK-BBS${numeric += 1}`;
      }
    }
    classIds = [];
    studentIds = [];
  }
  // update batchCreation status to complete
  await updateBatchCreationStatus(campaignId, batchCreationStatus.complete);
};

const createBatchSessionsGroupBySection = async (classes, campaignId, courseId) => {
  // classIds and studentIds to pass in input
  let studentIds = [];
  // handle the batch code increments
  const lastBatchSession = await fetchLastBatchSession();
  const lastBatchSessionCode = lastBatchSession[0].code;
  let numeric = Number(lastBatchSessionCode.substring(6));

  const schoolId = classes[0].school.id;

  // update batchCreation status to in-progress
  await updateBatchCreationStatus(campaignId, batchCreationStatus.inProgress);

  for (let i = 0; i < schoolClass.length; i += 1) {
    let batchCode = `TK-BBS${numeric += 1}`;
    if (schoolClass[i].students && schoolClass[i].students.length > 0) {
      schoolClass[i].students.forEach((student) => {
        studentIds[indexedDB].push(student.id);
      });
    }
    /* eslint-disable no-await-in-loop */
    // tries batchCodes on fail for max. 5 times before moving on
    for (let j = 0; j < ADD_BATCH_TRY_LIMIT; j += 1) {
      try {
        await createBatch(batchCode, schoolId, schoolClass[i].id, campaignId, studentIds, courseId);
        log(`Batch ${batchCode} added`);
        break;
      } catch (err) {
        log(`Batch ${batchCode} not added. Trying next batch code.`);
        batchCode = `TK-BBS${numeric += 1}`;
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

export {
  createBatchSessionsGroupBySection,
  createBatchSessionsGroupByGrade,
  getClassesGroupByGrade,
  fetchAllConnectedSchoolClasses,
  getSectionExists,
  fetchCampaign,
};
