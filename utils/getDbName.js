export default function getDbNAme() {
  const env = process.env.NODE_ENV || 'development';
  let dbName = 'core-app';

  if (env === 'test') {
    dbName = 'test-app';
  }
  return dbName;
}
