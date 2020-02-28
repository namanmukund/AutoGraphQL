import grades from '../../../../../../constants/grades';

export const getGradeEnum = () => {
  let gradeNameEnum = 'enum Grade {';
  grades.forEach((grade) => {
    gradeNameEnum += `${grade} `;
  });
  gradeNameEnum += '}';
  return gradeNameEnum;
};

const Grade = getGradeEnum();

export default Grade;
