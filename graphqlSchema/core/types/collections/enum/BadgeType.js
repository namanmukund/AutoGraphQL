import { badgeTypes } from '../../../../../constants';

const { character, equipment, skill } = badgeTypes;
const BadgeType = `
  enum BadgeType {
    ${character}
    ${equipment}
    ${skill}
  }`;

export default BadgeType;
