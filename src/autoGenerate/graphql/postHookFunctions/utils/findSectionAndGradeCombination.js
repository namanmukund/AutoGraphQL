const findSectionAndGradeCombination = (section, grade) => {
    let gradeAndSectionCombination = section + grade.split('e')[1]
    return gradeAndSectionCombination
}

export default findSectionAndGradeCombination