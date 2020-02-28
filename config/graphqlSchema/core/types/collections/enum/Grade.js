import { grades, extraGrades } from '../../../../../../constants';

export const getGradeEnum = () => {
  let gradeNameEnum = 'enum Grade {';
  grades.forEach((grade) => {
    gradeNameEnum += `${grade} `;
  });
  extraGrades.forEach((grade) => {
    gradeNameEnum += `${grade} `;
  });
  gradeNameEnum += '}';
  return gradeNameEnum;
};

const Grade = getGradeEnum();

export default Grade;
