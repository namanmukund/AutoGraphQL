import AWS from 'aws-sdk';
import { log, awsConfig } from '../../../utils';

AWS.config.update(awsConfig.aws);

const S3 = new AWS.S3();
const s3Bucket = awsConfig.s3.bucket;
const deleteFromS3 = (Key) => new Promise((resolve, reject) => {
  S3.deleteObject({
    Bucket: s3Bucket,
    Key,
  }, (err) => {
    if (err) {
      log(err, `Error deleting '${Key}'!`);
      reject(err);
    } else {
      log(`Successfully deleted '${Key}'!`);
      resolve();
    }
  });
});

export default deleteFromS3;
