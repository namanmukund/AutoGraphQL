import validateAuthentication from '../../../../../../utils/validateAuthentication';
import { MissingMandatoryInputInRequestError } from '../../../../../../constants/errors/input';
import getGoogleSpreadsheetData from '../../../../../../utils/getGoogleSpreadsheetData';

const addUpdateBulkSchoolUserData = async (root, params, context, info) => {
  validateAuthentication(context);
  const { sheetId, schoolName } = params;
  if (!sheetId || !schoolName) {
    throw new MissingMandatoryInputInRequestError();
  }
  await getGoogleSpreadsheetData('1iSG-4jsjeAdSsobatfi_UlCKgvhHTOvbk3dvweGM0VY');
  return [{ id: '123' }];
};

export default addUpdateBulkSchoolUserData;
