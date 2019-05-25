import { masteryLevels, scholarshipThreshHolds } from '../../../../../constants';

const getMasteryLevel = (quizInfo) => {
  // logic to calculate mastery level on basis of percentage
  const { proficient: proficientPercent, master: masterPercent, familiar: familiarPercent }
    = scholarshipThreshHolds;
  const { proficient, master, familiar, defaultMastery } = masteryLevels;
  let percentage = 0;
  if (quizInfo.quizReport) {
    percentage =
      (quizInfo.quizReport.correctQuestionCount / quizInfo.quizReport.totalQuestionCount) * 100;
  }
  if (percentage === proficientPercent) {
    return proficient;
  } else if (percentage >= masterPercent) {
    return master;
  } else if (percentage >= familiarPercent) {
    return familiar;
  }
  return defaultMastery;
};

export default getMasteryLevel;
