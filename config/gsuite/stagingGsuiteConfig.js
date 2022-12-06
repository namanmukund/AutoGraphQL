const decodedPrivateKey = Buffer.from(process.env.GSUIT_CONFIGURATION, 'base64').toString();

const stagingGsuiteCredentials = JSON.parse(decodedPrivateKey);

export { stagingGsuiteCredentials };
