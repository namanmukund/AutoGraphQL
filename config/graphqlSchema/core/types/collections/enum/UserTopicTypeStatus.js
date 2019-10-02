import { userTopicTypeStatus } from '../../../../../../constants';

const { complete, incomplete, skip } = userTopicTypeStatus;
const UserTopicTypeStatus = `
  enum UserTopicTypeStatus {
    ${complete}
    ${incomplete}
    ${skip}
  }`;

export default UserTopicTypeStatus;
