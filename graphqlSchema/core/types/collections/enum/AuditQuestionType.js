import { auditQuestionType } from '../../../../../constants';

const {
  mcq, input, rating, timestamp, bool,
} = auditQuestionType;
const AuditQuestionType = `
  enum AuditQuestionType {
    ${mcq}
    ${input}
    ${rating}
    ${timestamp}
    ${bool}
  }`;

export default AuditQuestionType;
