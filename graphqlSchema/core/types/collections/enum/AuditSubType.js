import { auditSubType } from '../../../../../constants';

const {
  b2cDemo, b2cPaid, b2b,
} = auditSubType;

const AuditSubType = `
  enum AuditSubType {
    ${b2cDemo}
    ${b2cPaid}
    ${b2b}
  }`;

export default AuditSubType;
