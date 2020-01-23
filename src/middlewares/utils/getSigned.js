// eslint-disable-next-line import/no-unresolved
const cf = require('aws-cloudfront-sign');
import { awsConfig } from '../../../utils/index'

const options = { keypairId: awsConfig.cloudFront.keypairId, privateKeyString: awsConfig.cloudFront.privateKeyString, expireTime: new Date().getTime() + 8000000000 };

const generateSignedUrl = async (url) => {
  const tempUrl = 'https://'+ awsConfig.cloudFront.uri.toString() + "/" + url;
  return cf.getSignedUrl(tempUrl, options);

};


export default generateSignedUrl;
