const { GoogleSpreadsheet } = require('google-spreadsheet');

const getGoogleSpreadsheetData = async (sheetId) => {
// spreadsheet key is the long id in the sheets URL
  const doc = new GoogleSpreadsheet(sheetId);

  // use service account creds
  await doc.useServiceAccountAuth({
    client_email: 'firebase-adminsdk-qhdaq@sampleapp-88c42.iam.gserviceaccount.com',
    private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC2i9qZZc93K46p\n00tgb80J16N76RRaZCDCjTTKls5AoHe8yIo04pwovWLE0bDOby+F1cb8tqkG/wLu\nF1AmoIuv4ctAglGKBD1cccg2ueFkTxgrsRJlBurVCqaKtiuKYU2TsoLiwVD6wLe+\nLj6rDOR25hmC5gzIcOlRGWwCgvG2nrI3mhajTz1Q6xMzEthNLBKBfa75zJpty3b7\ng8pA9uQtAMn3w1ruME2QoE64IiRVdqRcdfb3xd1Y04H4VzkANVWtOyh595qsB8u1\ntlqHXPbmcsfZ7Xwgicv+oGvVWftkWm8AKwaX/l+7RNoMYKnsq/kVPc2byBx11mki\nrH3LPcppAgMBAAECggEAEjTrth4F7bxd68lDvNgZyrADwcGTApr2+4CK8ePNqXt3\nxc/4nOK3MYcGGVxStpw3ULFsOdtcC3MWzzlrCJc9p2qtU39L86iNmDFPB0pN1Svg\nXMc57vKcLGh2COK3gANJcgA9drFSStg621CQdo4AIW28wKYCQ2Gjm6+d6rg1tIF/\nZDY+rMhy8RNhyKDkBsOtsV4N2nBV37hrnKzrRAx7SVszUsjmeV+EtTJ065/WU9gV\nUuovDkBCaOoEEiuaqTr6YjN0Kg34O8HflDCk+yc8cp96A+QLB3ea2Rh3q0tIyAuv\n5LlTiIRXYpIda8thwk0xBDov0kEpbeRn8re9sQy7SQKBgQDaHQG6FPGJFMfswRWl\nSbYxZ3koQf9f4vxp+mTa+vElWhCGonwejHae5EY+Vw0WqBNqAfLfDxTLrNZQUWNm\nXUO3VA+O1q4usWKrRR/UFsINdiiTo58x2L5TCukh6zPAre1tYeI79cEmVjJCSNQE\nz/C3iXinvt/IHawgHgU398/+rQKBgQDWQUPUOQV1Cq3ghCyaIMlrVORiCl9/Hg53\nCf2Mj2hKS7kSq+vfxCB8iLSbr1K9XO1f86VODoMuaXN90ffN+31fj3B5/hC4OU3p\n0nisyj6dxyj8pINSgS93l829Q5VvPTZauLE702pTgGPXHcXhz3Ef2RLANphoHtWj\nEpGtTqTeLQKBgFOgAXR96SlcrVZppUntHAyPFpXH0AjMd2iOlzKaOfDPOjzUeXAg\n/K3o6cGnEJ6aLG9ddeft2VRJ3RWITusFYRwd/6UNTFUcr67o3s4rN5V/swkAF949\nsqMWMNJPYlVCmiBxAhNpIvf23mgpkhiSPUGxVHBEL3qDXeYmfGu7+KQ1AoGAdrBm\n89y2sjS9R9/QmX1KN0Qq1EjsyA2Nc9I7/C7BVk8Gclp861PJr1NHweroye/9q6bc\nTxZpAz/1c6DqRthnhpV+eIYPGw7bo4ktwoKzF1Jp2TMFcKIR+o1EsvEKijn9r1ob\nDIo8n49DP7rFkScKgtsMsSBNY3iZXqH9w2UKne0CgYBQuC1zhALKeYyQm4Dwdrbp\n9xnCRFahcMVtFwxRDdN7U8BokNnDAEORP7uBJQbbbQ/iyd2M0EBFiHuMGPOmCtJl\nF59UIjUMz5ixkXa354ZZBQ7zJMcjm410Nz9z6HU1KKEF7SQQPl/XqENcYCz8xMrO\nBDZwfxjgjNs7tfEnjQF3UA==\n-----END PRIVATE KEY-----\n',
  });

  await doc.loadInfo(); // loads document properties and worksheets
  const sheet = doc.sheetsByIndex[0]; // or use doc.sheetsById[id]
  const rows = await sheet.getRows();
  return rows;
};

export default getGoogleSpreadsheetData;
