import { masteryLevels } from '../../../../../constants';

const {
  proficient, master, familiar, defaultMastery,
} = masteryLevels;
const MasteryLevelsType = `
  enum MasteryLevelsType {
    ${proficient}
    ${master}
    ${familiar}
    ${defaultMastery}
  }`;

export default MasteryLevelsType;
