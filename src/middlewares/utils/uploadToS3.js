import AWS from 'aws-sdk';
import { log, awsConfig } from '../../../utils';

AWS.config.update(awsConfig.aws);

const S3 = new AWS.S3();
const s3Bucket = awsConfig.s3.bucket;
const expiry = awsConfig.s3.signedExpiry;

const uploadToS3 = (Key, Body) => new Promise((resolve, reject) => {
  S3.putObject({
    Bucket: s3Bucket,
    ACL: awsConfig.ACL.publicReadWrite,
    Key,
    Body,
  }, (err) => {
    if (err) {
      log(err, `Error uploading '${Key}'!`);
      reject(err);
    } else {
      log(`Successfully uploaded '${Key}'!`);
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
