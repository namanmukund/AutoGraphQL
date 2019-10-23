import { masteryLevels, scholarshipThreshHolds } from '../../../../../constants';

const getMasteryLevel = (correctQuestionCount, totalQuestionCount) => {
  // logic to calculate mastery level on basis of percentage
  const { proficient: proficientPercent, master: masterPercent, familiar: familiarPercent } = scholarshipThreshHolds;
  const {
    proficient, master, familiar, defaultMastery,
  } = masteryLevels;
  let percentage = 0;
  if (correctQuestionCount && totalQuestionCount && totalQuestionCount !== 0) {
    percentage = (correctQuestionCount / totalQuestionCount) * 100;
  }
  if (percentage === proficientPercent) {
    return proficient;
  } if (percentage >= masterPercent) {
    return master;
  } if (percentage >= familiarPercent) {
    return familiar;
  }
  return defaultMastery;
};

export default getMasteryLevel;
