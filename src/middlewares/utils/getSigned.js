const cf = require('aws-cloudfront-sign');
import { awsConfig } from '../../../utils/index'

const env = 'cloudFront'
const aws = awsConfig[env];

const options = { keypairId: aws.keypairId, privateKeyString: aws.privateKeyString, expireTime: aws.expireTime };

const generateSignedUrl = async (url) => {
  const tempUrl = 'https://'+ awsConfig.cloudFront.uri.toString() + "/" + url;
  return cf.getSignedUrl(tempUrl, options);

};


export default generateSignedUrl;
