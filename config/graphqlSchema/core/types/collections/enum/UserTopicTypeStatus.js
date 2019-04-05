import { userTopicTypeStatus } from '../../../../../../constants';

const { complete, incomplete } = userTopicTypeStatus;
const UserTopicTypeStatus = `
  enum UserTopicTypeStatus {
    ${complete}
    ${incomplete}
  }`;

export default UserTopicTypeStatus;
