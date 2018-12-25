import { log, dbConfig } from '../utils';
import db from './db';

require('./app');

let dbReconnectCount = 1;
db.on('error', (err) => {
  log(`Failed to connect to DB. ${dbConfig.database.db}`);
  if (err.message && err.message.match(/failed to connect to server .* on first connect/)) {
    // Wait for a bit, then try to connect again
    setTimeout(() => {
      log(`Retry count ${dbReconnectCount}. Reconnecting to DB ${dbConfig.database.db}`);
      dbReconnectCount += 1;
      db.open(dbConfig.database.db);
    }, 15 * 1000);
  }
}).on('reconnected', () => {
  log('MongoDB reconnected!');
}).on('disconnected', () => {
  log('MongoDB disconnected!');
}).once('open', () => log(`Connected to DB. config: ${dbConfig.database.db}`));
