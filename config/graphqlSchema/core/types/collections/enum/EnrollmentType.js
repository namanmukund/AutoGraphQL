import { enrollmentTypes } from '../../../../../../constants';

const EnrollmentType = `
  enum EnrollmentType {
      ${enrollmentTypes.pro}
      ${enrollmentTypes.free}
  }`;

export default EnrollmentType;
