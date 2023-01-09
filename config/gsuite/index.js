let decodedPrivateKey;
if (process.env.GSUIT_CONFIGURATION) decodedPrivateKey = Buffer.from(process.env.GSUIT_CONFIGURATION, 'base64').toString();

let gsuiteCredential = {};
if (decodedPrivateKey) {
  gsuiteCredential = JSON.parse(decodedPrivateKey);
}
const gsuiteConfig = gsuiteCredential;

export default gsuiteConfig;
