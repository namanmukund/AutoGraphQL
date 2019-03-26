import { userComponentStatus } from '../../../../../../constants';

const UserComponentStatus = `
  enum UserComponentStatus {
    ${userComponentStatus.complete}
    ${userComponentStatus.incomplete}
  }`;

export default UserComponentStatus;
