import { batchCreationStatus } from '../../../../../constants';

const { todo, inProgress, complete } = batchCreationStatus;
const BatchCreationStatus = `
  enum BatchCreationStatus {
    ${todo}
    ${inProgress}
    ${complete}
  }`;

export default BatchCreationStatus;
