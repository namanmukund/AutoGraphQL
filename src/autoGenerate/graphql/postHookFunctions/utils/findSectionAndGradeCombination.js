const findSectionAndGradeCombination = (section, grade) => {
  const gradeAndSectionCombination = section + grade.split('e')[1];
  return gradeAndSectionCombination;
};

export default findSectionAndGradeCombination;
