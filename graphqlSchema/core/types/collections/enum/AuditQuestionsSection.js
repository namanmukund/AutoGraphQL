import { auditQuestionsSection } from '../../../../../constants';

const {
  classQuality,
  interpersonalSkills,
  addTimestampSpecificComments,
  negativeTimestampSigns,
  processMonitoring,
  codingExercises,
  other,
} = auditQuestionsSection;

const AuditQuestionsSection = `
  enum AuditQuestionsSection {
    ${classQuality}
    ${interpersonalSkills}
    ${addTimestampSpecificComments}
    ${negativeTimestampSigns}
    ${processMonitoring}
    ${codingExercises}
    ${other}
  }`;

export default AuditQuestionsSection;
