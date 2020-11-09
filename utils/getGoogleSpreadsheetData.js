const { GoogleSpreadsheet } = require('google-spreadsheet');

const getGoogleSpreadsheetData = async (sheetId) => {
// spreadsheet key is the long id in the sheets URL
  const doc = new GoogleSpreadsheet(sheetId);

  // use service account creds
  await doc.useServiceAccountAuth({
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQC/+6ou2ccTf1hQ\nr+8oe/fpjYunmfd4oE4bxmv03vX0+hYboH8UZkpv3B3cP+ts8HeZLrzigsHGIiLC\n+Cw4JV1iW0akalrcz+9E23LkYZIpADqoHbhRAhigkBZgblpSgsON8u7PZ4begEm2\nzEIJo606zGiUocecUKdSODjHBBmubTsDl0h8Lvh8gxPV8oIaKIfLIdIN0FxrL97p\nDOEpHWy8Ummlumvi03j6K+zq9y2x+Ic2ddSUIXjj6Liy26OXKEzslnwbSeqASAxq\nD04wUNlRAEVBypOZOyxUuirikc6peoeglTs57qs9RaXR/La58ov999UnPOu/Gcsa\nd7UoGQUdAgMBAAECggEAIc/Kufwgb9pkfTdzHTPyJmfHshGvkEbZYtJoJoUTF91o\nwd5bK0ZVs0w21RjL15ClW6zr1s/VHVZbPW/UZ+IKx50QPLo/fPbBKuUkX70gbwir\ni/rKALhoCnU9/6dH0JLXqpsfvJb83ZiGAwQH2GdDheDExXKVs33P7i7ZLxHVjQ7B\nM4Rz+9WQWdgDYXc+EEYslwFXeihbgNj3ccXZmvBv/s0fjeQClvyJZ7PMfffCmsVq\nScwxHjTYMZ6ssidXnOvC2Ga3LrtV3sX64dke9S2iXMcteFWOzbrA/DoGSIUN6EA4\ni58s2UJqBiT0xi1qR1vnOLv/8iVeLCkB6Ap01Jyu4QKBgQDiojACzIRRnNLzx+HE\nfwtkbgVd3ND9lNOOcYEI2ZQngmAMz+uyYKPIyikRh0YICG/d5Q6inMO5MHB+mesc\nP8Lhc+LMkkwPDGlbAIihtiIYgdh9hoJUpqEI+HPqwXvV3kk5CTap6aeTEmVlzeFV\nbm7uBOv9yX4LgvfISLblPMSLfQKBgQDY3BAlYY+T6wIOceoMTbVCKroFq+nvoYNq\nZ+/BNFZ5vH3w0j8NdSRZ9yZYYYeJeAG/mRZaaw4BTCCxzalxgWgeqo3j4TADfr25\nt3bgD1TW/ZNxzBrKrriHu9KvQhCLiW71iJC4rvYShu6Uaq6yTf0XfwV+dPdMexLu\n35t0MHlSIQKBgQCVefWCkxOepHm6UhZFPKnt5mbhvpeU+QkDxTce+CqwWFwzdxt0\nviqobzXhGsCE4dOunbomZJDu3tUDm08nhaJqgr2OwdsqfbwrSlHTnsYkNdftCr+B\nR5mkygHiTxT3PTI8TShhrvtYlGSOXdkGON0vXc2syK26t/nnfpYq4gacHQKBgQCY\nL5eFJDpGbB49VOQTTlVt4d46LLM3X/mBqv8ubzRgqk8XufRV1Wd1W2SlkYw0hOt1\nMlHlkkt5zZsELHhFF7OiEb8RtO6lBUTQGFhsVVYMqlfW/I2wv3zwhHcOVyaVRhWA\nah5l/SLjTZ4Que1vZBvBaXrJi/wgyB45VOMbXwlFAQKBgQCRfdqx0c00UwL2wrdD\nw3qSK+1RY8KpsFp/hThkmWNNFW504tzhTqhLQXwwVj58QkP5duqAoq4iu5c4Jlgc\ntxWVcUBiEB+CO3IUkoZqb2uI1uuOjW8YUNj89hWeGWG8oPYci2KKJ47dfrRneQkd\n0J4sE+y7vIwfpmaT7jMwhSgCdA==\n-----END PRIVATE KEY-----\n',
  });

  await doc.loadInfo(); // loads document properties and worksheets
  const sheet = doc.sheetsByIndex[0]; // or use doc.sheetsById[id]
  const rows = await sheet.getRows();
  return rows;
};

export default getGoogleSpreadsheetData;
