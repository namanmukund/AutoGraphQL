import { skillsLevel } from '../../../../../constants';

const {
  easy, medium, hard
} = skillsLevel;
const SkillsLevel = `
  enum SkillsLevel {
      ${easy}
      ${medium}
      ${hard}
  }`;

export default SkillsLevel;
