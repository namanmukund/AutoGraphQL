import { badgeTypes } from '../../../../../constants';

const { character, equipment } = badgeTypes;
const BadgeType = `
  enum BadgeType {
    ${character}
    ${equipment}
  }`;

export default BadgeType;
