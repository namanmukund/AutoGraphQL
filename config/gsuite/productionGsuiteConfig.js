const decodedPrivateKey = Buffer.from(process.env.GSUIT_CONFIGURATION, 'base64').toString();

const productionGsuiteCredentials = JSON.parse(decodedPrivateKey);

export { productionGsuiteCredentials };
