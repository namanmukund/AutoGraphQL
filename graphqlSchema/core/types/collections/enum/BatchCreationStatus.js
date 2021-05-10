import { batchCreationStatus } from '../../../../../constants';

const { grade, section } = batchCreationStatus;
const BatchCreationStatus = `
  enum BatchCreationStatus {
    ${grade}
    ${section}
  }`;

export default BatchCreationStatus;
