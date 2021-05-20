import { batchCreationBasis } from '../../../../../constants';

const { grade, section } = batchCreationBasis;
const BatchCreationBasis = `
  enum BatchCreationBasis {
    ${grade}
    ${section}
  }`;

export default BatchCreationBasis;
