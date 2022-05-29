/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop, no-console */
import validateAuthentication from '../../../../../../utils/validateAuthentication';
import { MissingMandatoryInputInRequestError } from '../../../../../../constants/errors/input';
import getGoogleSpreadsheetData from '../../../../../../utils/getGoogleSpreadsheetData';
import getUserFromDBQuery from '../user/utils/getUserFromDBQuery';
import { QueryController } from '../../../controllers';
import { checkPasswordAndReturnUserWithToken } from '../utils/checkPasswordAndReturnUserWithToken';

const verifyBulkSchoolUserLogin = async (_root, params, context) => {
  validateAuthentication(context);
  const { sheetId, schoolName } = params;
  if (schoolName) {
    throw new MissingMandatoryInputInRequestError();
  }
  const errorLogs = [];
  if (sheetId) {
    const sheetDataRows = await getGoogleSpreadsheetData(sheetId);
    const modelQueries = new QueryController('User', { bypass: true, user: true });
    // eslint-disable-next-line no-restricted-syntax
    for (const [index, row] of sheetDataRows.entries()) {
      try {
        console.log('Processing row number........', index + 2);
        const password = row.parentEmail && row.parentEmail.trim().toLowerCase().split('@')[0];
        await getUserFromDBQuery(
          { email: row.parentEmail },
          modelQueries,
        // eslint-disable-next-line no-loop-func
        ).then(async (fetchedUser) => {
          if (!fetchedUser) {
            throw new Error('User not Found');
          }
          await checkPasswordAndReturnUserWithToken(fetchedUser, {
            email: row.parentEmail, password,
          }, { bypass: true, user: true });
        });
      } catch (e) {
        console.log('Error........', e);
        errorLogs.push({
          sheetRow: index + 2,
          parentEmail: row.parentEmail,
          childName: row.childName,
          parentName: row.parentName,
          phoneNumber: row.phoneNumber,
          error: e.message || e,
        });
      }
    }
  }
  return {
    status: 'completed',
    errorLogs,
  };
};

export default verifyBulkSchoolUserLogin;
