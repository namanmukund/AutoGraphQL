import { stagingGsuiteCredentials } from './stagingGsuiteConfig';
import { productionGsuiteCredentials } from './productionGsuiteConfig';

const gsuiteConfig = {
  staging: stagingGsuiteCredentials,
  production: productionGsuiteCredentials,
  development: stagingGsuiteCredentials,
};

export default gsuiteConfig;
