import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import addUpdateSchoolClass from '../../../postHookFunctions/utils/addUpdateSchoolClass';

const studentsInSchoolQuery = () => `
query{
  school(id: "ckpf9677p003y0vuyhol0fho9") {
    students{
      id
      grade
      section
    }
  }
}
`;

const updateSchoolClassInSchoolStudents = async () => {
  const studentsInSchoolQueryRes = await callLocalGraphqlApi(studentsInSchoolQuery());
  const studentsArray = get(studentsInSchoolQueryRes, 'data.school.students', []);

  // eslint-disable-next-line no-restricted-syntax
  for (const student of studentsArray) {
    if (student.id && student.grade && student.section) {
      const { id, grade, section } = student;
      // eslint-disable-next-line no-await-in-loop
      const schoolClassId = await addUpdateSchoolClass(
        {
          grade,
          section,
        },
        'ckpf9677p003y0vuyhol0fho9',
        id,
      );
      // eslint-disable-next-line no-console
      console.log('------------------------------added student id', id);
      console.log('------------------------------added schoolClassId', schoolClassId);
    }
  }
};

export default updateSchoolClassInSchoolStudents;
