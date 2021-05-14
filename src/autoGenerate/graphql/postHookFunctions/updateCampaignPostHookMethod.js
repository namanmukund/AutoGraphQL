import { get } from 'lodash';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import { NoSectionExists } from '../../../../constants/errors/db';
import { batchType } from '../../../../constants';

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

const fetchPublishedCourse = async () => {
  const query = `
            {
              courses(filter:{status: published}){
                id
                title
              }
            }
            `;
  const course = await callLocalGraphqlApi(query);
  return get(course, 'data.courses', []);
}

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
  for (let i = 0; i < classesConnectIds.length; i += 1) {
    const data = await fetchSchoolClass(classesConnectIds[i]);
    classes.push(data);
  }
  return classes;
}

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
}

const createBatchSessionsGroupByGrade = async (classesGroupByGrade, campaignId) => {
  // classIds and studentIds to pass in input
  let classIds = [];
  let studentIds = [];
  // handle the batch code increments
  const lastBatchSession = await fetchLastBatchSession();
  const lastBatchSessionCode = lastBatchSession[0].code;
  let numeric = Number(lastBatchSessionCode.substring(6));

  // fetch the course code 
  const course = await fetchPublishedCourse();
  const courseId = course[0].id;

  for (const grade of classesGroupByGrade.keys()) {
    const classesInGrade = classesGroupByGrade.get(grade);
    const schoolId = classesInGrade[0].school.id;
    const batchCode = `TK-BBS${numeric += 1}`;
    classesInGrade.forEach((schoolClass) => {
      classIds.push(schoolClass.id);
      if (schoolClass.students && schoolClass.students.length > 0) {
        schoolClass.students.forEach((student) => {
          studentIds.push(student.id);
        });
      }
    });
    console.log(classIds);
    console.log(studentIds);
    console.log(schoolId);
    console.log(campaignId);
    console.log('************');
    console.log(batchCode);
    console.log(courseId);
    await createBatch(batchCode, schoolId, classIds, campaignId, studentIds, courseId);
    console.log('Batch Created');
    classIds = [];
    studentIds = [];
  }
};

const getClassesGroupByGrade = (classes) => {
  let classesMap = new Map();
  classes.forEach(schoolClass => {
    if (classesMap.has(schoolClass.grade)) {
      const arr = classesMap.get(schoolClass.grade);
      arr.push(schoolClass);
      classesMap.set(schoolClass.grade, arr);
    } else {
      const arr = [];
      arr.push(schoolClass);
      classesMap.set(schoolClass.grade, arr);
    }
  })
  return classesMap;
}


const updateCampaignPostHookMethod = async (input, params, mutationName, context) => {
  const { id: campaignId, input: campaignInput, classesConnectIds } = params;

  // now we proceed to create batches only when the combination of 
  // batchCreationBasis & classes is passed 
  const { batchRules } = campaignInput;
  if (batchRules && batchRules.batchCreationBasis.length > 0 && classesConnectIds && classesConnectIds.length > 0) {
    // fetch all the the grades and sections of the respective classes and put them in respective buckets
    const classes = await fetchAllConnectedSchoolClasses(classesConnectIds);
    console.log(classes);
    // here sort the classes based on the batchCreationBasis rules 
    // if basis is section, all classes will be it's own group
    // if basis is grade, all classes with same grade will be grouped together

    if (batchRules.batchCreationBasis === 'grade') {
      // Map, with key = grade, value = array of classes corresponding to that grade
      const classesGroupByGrade = getClassesGroupByGrade(classes);
      await createBatchSessionsGroupByGrade(classesGroupByGrade, campaignId,);

    } else {
      // check if section exists in atleast one of the school classes
      const noSectionExists = getSectionExists(classes);
      if (noSectionExists) {
        throw new NoSectionExists();
      } else {
        // create separate batches for all the schoolClasses

      }
    }

    // then  call async method which will create the batches..
  }

};

export default updateCampaignPostHookMethod;
