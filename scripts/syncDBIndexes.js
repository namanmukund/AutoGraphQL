/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
/* eslint no-restricted-syntax: ["error", "FunctionExpression", "WithStatement",
"BinaryExpression[operator='in']"] */
import db from '../src/db';
import models from '../src/autoGenerate/models';

process.env.PORT = 2000;
process.env.SOCKET_PORT = 2030;
process.env.IO_SOCKET_PORT = 2040;
require('../src/serverCloud');

db.once('open', async () => {
  console.log('Starting the index syncing process...............');
  const promiseArray = [];
  const modelKeys = Object.keys(models);
  for (const key of modelKeys) {
    console.log(`Syncing index for Model: ${key}`);
    promiseArray.push(models[key].syncIndexes());
  }
  console.log('Waiting for the promise to return..................');
  await Promise.all(promiseArray).then(() => {
    console.log('Exiting the index syncing process................');
    process.exit(0);
  });
});
