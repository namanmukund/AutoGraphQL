import { auditSubType } from '../../../../../constants';

const {
  b2bDemo, b2bPaid, b2cDemo, b2cPaid,
} = auditSubType;

const AuditSubType = `
  enum AuditSubType {
    ${b2bDemo}
    ${b2bPaid}
    ${b2cDemo}
    ${b2cPaid}
  }`;

export default AuditSubType;
