import { userSourceOrigin } from '../../../../../constants';

const UserOriginSource = `
  enum UserOriginSource {
    ${userSourceOrigin.instagram}
    ${userSourceOrigin.school}
    ${userSourceOrigin.facebook}
    ${userSourceOrigin.google}
    ${userSourceOrigin.website}
    ${userSourceOrigin.transformation}
    ${userSourceOrigin.radioStreet}
    ${userSourceOrigin.agent}
  }`;

export default UserOriginSource;
