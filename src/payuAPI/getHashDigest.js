const crypto = require('crypto');

const mySecret = process.env.PAYU_API_SECRET;

const getHashDigest = (object) => {
  const shasum = crypto.createHmac('sha256', mySecret);
  shasum.update(JSON.stringify(object));
  return shasum.digest('hex');
};

export default getHashDigest;
