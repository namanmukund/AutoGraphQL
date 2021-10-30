const crypto = require('crypto');

const mySecret = process.env.TYPEFORM_TOKEN;

const getHashDigest = (object) => {
  const shasum = crypto.createHmac('sha256', mySecret).update(JSON.stringify(object)).digest('base64');
  return `sha256=${shasum}`;
};

export default getHashDigest;
