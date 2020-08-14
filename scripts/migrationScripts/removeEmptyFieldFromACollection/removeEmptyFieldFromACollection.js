/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
/* eslint no-restricted-syntax: ["error", "FunctionExpression", "WithStatement",
"BinaryExpression[operator='in']"] */
import db from '../../../src/db';
import getTargetedDocuments from './utils/getTargetedDocuments';
import unsetAFieldFromACollection from './utils/unsetAFieldFromACollection';

process.env.PORT = 2000;
process.env.SOCKET_PORT = 2030;
process.env.IO_SOCKET_PORT = 2040;
require('../../../src/serverCloud');

const removeEmptyFieldFromACollection = async (targetedCollection, targetedField) => {
  const docs = await getTargetedDocuments(targetedCollection, targetedField);
  if (!docs || !docs.length) {
    console.log('Total are no documents to process hence exiting!!!');
    process.exit(0);
  }
  console.log('Total targeted docs found are ', docs.length);
  for (const doc of docs) {
    const { id: targetedId } = doc;
    console.log(`Processing for ${targetedCollection} of id ${targetedId}`);
    await unsetAFieldFromACollection(targetedId, targetedCollection, targetedField);
  }
  process.exit(0);
};
db.once('open', () => {
  const targetedCollection = process.argv[2];
  const targetedField = process.argv[3];
  if (!targetedCollection || !targetedField) {
    console.log('Collection name and field name are mandatory');
    process.exit(0);
  }
  removeEmptyFieldFromACollection(targetedCollection, targetedField);
});
