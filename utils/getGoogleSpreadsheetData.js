import * as GoogleSpreadsheet from 'google-spreadsheet';

const getGoogleSpreadsheetData = async (sheetId) => {
  // spreadsheet key is the long id in the sheets URL
  const doc = new GoogleSpreadsheet(sheetId);
  // use service account creds
  await doc.useServiceAccountAuth({
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY,
  });

  await doc.loadInfo(); // loads document properties and worksheets
};
