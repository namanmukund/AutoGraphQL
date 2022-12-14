import { DATABASE_DIALECTS } from '../../../../../constants';

const DatabaseDialect = `
  enum DatabaseDialect {
    # MongoDB database
    ${DATABASE_DIALECTS.mongoose}
    
    # Postgres Database
    ${DATABASE_DIALECTS.postgres}
  }`;

export default DatabaseDialect;
