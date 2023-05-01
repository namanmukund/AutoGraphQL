/* eslint-disable no-await-in-loop */
/* eslint-disable no-loop-func */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
import { get } from 'lodash';
import getGoogleSpreadsheetData from '../../../../../../utils/getGoogleSpreadsheetData';
import { callLocalGraphqlApi } from '../../../../../api';

const updateStudentGradeSection = async (context) => {
  const sheetDataRows = await getGoogleSpreadsheetData('1zbtv2rzAJoz2irT94p04sV8CyL_gP5avSRFkwny51dM');
  const emails = [];
  for (const [index, row] of sheetDataRows.entries()) {
    console.log('Processing row number........', index + 2);
    emails.push(row.Email);
  }
  const studentsRes = await callLocalGraphqlApi(`{
  studentProfiles(
    filter: {
      and: [
        { school_some: { id: "cles4avc107ma0uhmflcm7tt7" } }
        { parents_some: { user_some: { email_in: ${JSON.stringify(emails)} } } }
      ]
    }
  ) {
    id
    parents {
      user {
        email
      }
    }
  }
}
`);
  const students = get(studentsRes, 'data.studentProfiles', []);
  const updatedStudents = [];
  for (const [index, row] of sheetDataRows.entries()) {
    const studentDetail = students.find((student) => get(student, 'parents[0].user.email') === row.Email);
    if (studentDetail) {
      const studentId = get(studentDetail, 'id');
      const { Grade, Section } = row;
      await callLocalGraphqlApi(`mutation {
        updateStudentProfile(id: "${studentId}", input: { grade: Grade2, section: ${Section} }) {
            id
        }
        }`);
      console.log('Processed row number........', index + 2);
    }
  }
  console.log({ updatedStudents: updatedStudents.length });
};

export default updateStudentGradeSection;
