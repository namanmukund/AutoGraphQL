import cf from 'aws-cloudfront-sign';
import { awsConfig } from '../../../utils/index';
// const cf = require('aws-cloudfront-sign');

const { cloudFront: { keypairId, privateKeyString, expireTime } } = awsConfig;


const options = { keypairId, privateKeyString, expireTime };

const generateSignedUrl = async (url) => {
  const tempUrl = `https://${awsConfig.cloudFront.uri.toString()}/${url}`;
  return cf.getSignedUrl(tempUrl, options);
};


export default generateSignedUrl;
