import { userSourceOrigin } from '../../../../../constants';

const UserOriginSource = `
  enum UserOriginSource {
    ${userSourceOrigin.facebook}
    ${userSourceOrigin.google}
    ${userSourceOrigin.instagram}
    ${userSourceOrigin.school}
    ${userSourceOrigin.website}
    ${userSourceOrigin.transformation}
  }`;

export default UserOriginSource;
