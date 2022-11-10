import { DATABASE_DIALECTS } from '../../../../../constants';

const DatabaseDialect = `
  enum DatabaseDialect {
    # MongoDB database i.e mdb
    ${DATABASE_DIALECTS.mongodb}
    
    # Postgres Database i.e pg
    ${DATABASE_DIALECTS.postgres}
  }`;

export default DatabaseDialect;
