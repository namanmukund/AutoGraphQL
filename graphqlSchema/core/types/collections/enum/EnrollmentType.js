import { enrollmentTypes } from '../../../../../constants';

const { pro, free } = enrollmentTypes;
const EnrollmentType = `
  enum EnrollmentType {
      ${pro}
      ${free}
  }`;

export default EnrollmentType;
