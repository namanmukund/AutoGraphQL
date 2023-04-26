/* eslint-disable no-console */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
import { get } from 'lodash';
import { callLocalGraphqlApi } from '../../../../../api';

const getSchoolAcademicYear = async (schoolId, context) => {
  const academicYearRes = await callLocalGraphqlApi(`{
    academicYears(filter: { school_some: { id: "${schoolId}" } }) {
        id
    }
    }`, context);
  let academicYearConnectId = get(academicYearRes, 'data.academicYears[0].id');
  if (!academicYearConnectId) {
    // We are adding academic year for the past year, similarly we need to do this for next academic year
    const addAcademicYearRes = await callLocalGraphqlApi(`mutation {
    addAcademicYear(
        input: {
        startDate: "2022-04-30T18:30:00.000Z"
        endDate: "2023-04-30T18:29:59.000Z"
        }
        schoolConnectId: "${schoolId}"
    ) {
        id
    }
    }
    `, context);
    academicYearConnectId = get(addAcademicYearRes, 'data.addAcademicYear.id');
  }
  return academicYearConnectId;
};

const getSchoolStudents = async (schoolId, context) => {
  const studentsRes = await callLocalGraphqlApi(`{
  studentProfiles(filter: { school_some: { id: "${schoolId}" } }) {
    id
  }
}
`, context);
  return get(studentsRes, 'data.studentProfiles', []);
};

const getSchoolClasses = async (schoolId, context) => {
  const schoolClassesRes = await callLocalGraphqlApi(`{
  schoolClasses(filter: { school_some: { id: "${schoolId}" } }) {
    id
  }
}
`, context);
  return get(schoolClassesRes, 'data.schoolClasses', []);
};

const getSchoolBatches = async (schoolId, context) => {
  const studentsRes = await callLocalGraphqlApi(`{
  batches(filter: { school_some: { id: "${schoolId}" } }) {
    id
  }
}
`, context);
  return get(studentsRes, 'data.batches', []);
};

const updateStudentAndClassesOfSchoolsForAcademicYear = async (context) => {
  const schoolsRes = await callLocalGraphqlApi(`{
    schools(filter: { code_exists: true }) {
        id
        createdAt
    }
    }
    `, context);
  const schools = get(schoolsRes, 'data.schools', []);
  console.log({ schools: schools.length });
  let i = 0;
  for (const school of schools) {
    const schoolConnectId = get(school, 'id');
    const dateCheck = new Date('Sun Jan 01 2023 00:00:00 GMT+0530 (India Standard Time)');
    const schoolCreatedDate = new Date(get(school, 'createdAt'));
    if (dateCheck > schoolCreatedDate) {
      i += 1;
      const academicYearConnectId = await getSchoolAcademicYear(schoolConnectId, context);
      if (academicYearConnectId) {
        const studentProfiles = await getSchoolStudents(schoolConnectId, context);
        const studentProfileIds = studentProfiles.map((student) => get(student, 'id'));
        const batches = await getSchoolBatches(schoolConnectId, context);
        const batchesIds = batches.map((batch) => get(batch, 'id'));
        const schoolClasses = await getSchoolClasses(schoolConnectId, context);
        const schoolClassesIds = schoolClasses.map((schoolClass) => get(schoolClass, 'id'));
        await callLocalGraphqlApi(`mutation {
        updateAcademicYear(
          id: "${academicYearConnectId}"
          studentsConnectIds: ${JSON.stringify(studentProfileIds)}
          batchesConnectIds: ${JSON.stringify(batchesIds)}
          classesConnectIds: ${JSON.stringify(schoolClassesIds)}
        ) {
          id
        }
      }
      `, context);
      }
    }
  }
  console.log({ i });
};

export default updateStudentAndClassesOfSchoolsForAcademicYear;
