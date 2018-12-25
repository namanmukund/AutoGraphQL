/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
/* eslint no-restricted-syntax: ["error", "FunctionExpression", "WithStatement",
"BinaryExpression[operator='in']"] */

import {
  updateUsageCountToZeroInFile,
  getFileIds,
  getFileUsageCountByFileId,
  updateUsageCount,
} from './utils';

import db from '../../src/db';

process.env.PORT = 2000;
process.env.SOCKET_PORT = 2030;
process.env.IO_SOCKET_PORT = 2040;
require('../../src/serverCloud');

const updateUsageCountInFile = async () =>
  updateUsageCountToZeroInFile()
    .then(async (updateCount) => {
      console.log('**************************************************');
      console.log('Status of total docs whose usageCount updated to 0 is : ', updateCount);
      console.log('.................................................');
      const fileIds = await getFileIds();
      for (const fileId of fileIds) {
        const usageCount = await getFileUsageCountByFileId(fileId);

        if (usageCount !== 0) {
          const updateStatus = await updateUsageCount(fileId, usageCount);
          console.log(`FileId ${fileId}, usageCount ${usageCount}`);
          console.log(`Update Status: ${JSON.stringify(updateStatus)}`);
          console.log('.................................................');
        } else {
          console.log(`FileId ${fileId}, usageCount ${usageCount}`);
          console.log('.................................................');
        }
      }
      console.log('**************************************************');
      process.exit(0);
    });

db.once('open', () => {
  updateUsageCountInFile();
});

