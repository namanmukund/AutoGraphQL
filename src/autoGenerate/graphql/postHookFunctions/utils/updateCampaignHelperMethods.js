import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callGraphqlApi';
import { batchType } from '../../../../../constants';
import { log } from '../../../../../utils';

const fetchSchoolClass = async (schoolClassId) => {
  const query = `
          {
            schoolClass(id: "${schoolClassId}"){
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
  const schoolClass = await callLocalGraphqlApi(query);
  return get(schoolClass, 'data.schoolClass', {});
};

const fetchCampaign = async (campaignId) => {
  const query = `
            {
              campaign(id: "${campaignId}"){
                type
                course{
                  title
                }
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
  const classes = [];
  /* eslint-disable no-await-in-loop */
  for (let i = 0; i < classesConnectIds.length; i += 1) {
    const data = await fetchSchoolClass(classesConnectIds[i]);
    classes.push(data);
  }
  return classes;
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

  /* eslint-disable no-restricted-syntax */
  for (const grade of classesGroupByGrade.keys()) {
    const classesInGrade = classesGroupByGrade.get(grade);
    const schoolId = classesInGrade[0].school.id;
    const batchCode = `TK-BBS${numeric += 1}`;
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
    try {
      await createBatch(batchCode, schoolId, classIds, campaignId, studentIds, courseId);
      log(`Batch ${batchCode} added`);
    } catch (err) {
      log(`Batch ${batchCode} not added. Trying next batch code.`);
      for (let i = 0; i < 4; i++) {
        batchCode = `TK-BBS${numeric += 1}`;
        try {
          await createBatch(batchCode, schoolId, classIds, campaignId, studentIds, courseId);
          log(`Batch ${batchCode} added`);
          break;
        } catch (err) {
          log(`Batch ${batchCode} not added. Trying next batch code.`);
        }
      }
    }
    classIds = [];
    studentIds = [];
  }
};

const createBatchSessionsGroupBySection = async (classes, campaignId, courseId) => {
  // classIds and studentIds to pass in input
  let studentIds = [];
  // handle the batch code increments
  const lastBatchSession = await fetchLastBatchSession();
  const lastBatchSessionCode = lastBatchSession[0].code;
  let numeric = Number(lastBatchSessionCode.substring(6));

  const schoolId = classes[0].school.id;

  for (let i = 0; i < schoolClass.length; i += 1) {
    const batchCode = `TK-BBS${numeric += 1}`;
    if (schoolClass[i].students && schoolClass[i].students.length > 0) {
      schoolClass[i].students.forEach((student) => {
        studentIds[indexedDB].push(student.id);
      });
    }
    /* eslint-disable no-await-in-loop */
    try {
      await createBatch(batchCode, schoolId, schoolClass[i].id, campaignId, studentIds, courseId);
      log(`Batch ${batchCode} added`);
    } catch (err) {
      log(`Batch ${batchCode} not added. Trying next batch code.`);
      for (let i = 0; i < 4; i++) {
        batchCode = `TK-BBS${numeric += 1}`;
        try {
          await createBatch(batchCode, schoolId, schoolClass[i].id, campaignId, studentIds, courseId);
          log(`Batch ${batchCode} added`);
          break;
        } catch (err) {
          log(`Batch ${batchCode} not added. Trying next batch code.`);
        }
      }
    }
    studentIds = [];
  }
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
