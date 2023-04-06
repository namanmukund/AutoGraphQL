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
    }
    }
    `, context);
  const schools = get(schoolsRes, 'data.schools', []);
  for (const school of schools) {
    const schoolConnectId = get(school, 'id');
    const academicYearConnectId = await getSchoolAcademicYear(schoolConnectId, context);
    if (academicYearConnectId) {
      const studentProfiles = await getSchoolStudents(schoolConnectId, context);
      let updateStudentsMutationStr = '';
      for (const studentProfile of studentProfiles) {
        const studentProfileId = get(studentProfile, 'id');
        updateStudentsMutationStr += `updateStudent${studentProfileId}: updateStudentProfile(id: "${studentProfileId}", academicYearsConnectIds: ["${academicYearConnectId}"]) {
            id
        }`;
      }
      if (updateStudentsMutationStr) {
        const updatedStudentProfilesRes = await callLocalGraphqlApi(`mutation {
            ${updateStudentsMutationStr}
        }`, context);
        if (updatedStudentProfilesRes) {
          console.log('StudentProfiles updated with academic year');
        }
      }

      const batches = await getSchoolBatches(schoolConnectId, context);
      let updateBatchesMutationStr = '';
      for (const batch of batches) {
        const batchId = get(batch, 'id');
        updateBatchesMutationStr += `updateBatch${batchId}: updateBatch(id: "${batchId}", academicYearConnectId: "${academicYearConnectId}") {
            id
        }`;
      }
      if (updateBatchesMutationStr) {
        const updatedbatchesRes = await callLocalGraphqlApi(`mutation {
            ${updateBatchesMutationStr}
        }`, context);
        if (updatedbatchesRes) {
          console.log('Batches updated with academic year');
        }
      }
    }
  }
};

export default updateStudentAndClassesOfSchoolsForAcademicYear;
