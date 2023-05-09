import AWS from 'aws-sdk';
import { ALLOWED_MIME_TYPES } from '../../../constants';
import { log, awsConfig } from '../../../utils';

AWS.config.update(awsConfig.aws);

const S3 = new AWS.S3();
const s3Bucket = awsConfig.s3.bucket;
const expiry = awsConfig.s3.signedExpiry;

const uploadToS3 = (Key, Body, fileMimeType = null) => new Promise((resolve, reject) => {
  /** Sending Content type (MIME) manually to S3 */
  const S3ContentType = {};
  if (typeof fileMimeType === 'string'
    && ALLOWED_MIME_TYPES.some((type) => fileMimeType.includes(type))
  ) {
    S3ContentType.ContentType = fileMimeType;
  }

  log(`AWS CONFIG -> ${JSON.stringify(awsConfig, 0, 2)}`);
  log(`S3 PutObject -> ${JSON.stringify({
    Bucket: s3Bucket,
    ACL: awsConfig.ACL.publicReadWrite,
    Key,
    ...S3ContentType,
  }, 0, 2)}`);

  S3.putObject({
    Bucket: s3Bucket,
    ACL: awsConfig.ACL.publicReadWrite,
    Key,
    Body,
    ...S3ContentType,
  }, (err, data) => {
    if (err) {
      log(err, `Error uploading '${Key}'!`);
      log(`File Error ${JSON.stringify(err, 0, 2)}`);
      reject(err);
    } else {
      log(`Successfully uploaded '${Key}'!`);
      log(`File Response ${JSON.stringify(data, 0, 2)}`);
      resolve();
    }
  });
});

const getSignedS3Uri = (Key) => new Promise((resolve, reject) => {
  S3.getSignedUrl('getObject', {
    Bucket: s3Bucket,
    Key,
    Expires: expiry,
  }, (err, url) => {
    if (err) {
      log(err, `Error generating signed uri for: '${Key}'!`);
      reject(err);
    } else {
      log(`Successfully generated signed uri for: '${Key}'!`);
      resolve(url);
    }
  });
});

export { uploadToS3, getSignedS3Uri };
