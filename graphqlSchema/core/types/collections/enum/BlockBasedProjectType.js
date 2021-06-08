import { blockBasedProjectType } from '../../../../../constants';

const {
  project, practice,
} = blockBasedProjectType;
const BlockBasedProjectType = `
  enum BlockBasedProjectType {
      ${project}
      ${practice}
  }`;

export default BlockBasedProjectType;
