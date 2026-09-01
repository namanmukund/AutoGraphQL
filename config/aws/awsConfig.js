const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.AWS_REGION || 'us-east-1';
const bucket = process.env.AWS_S3_BUCKET || 'autographql-storage';
const cloudFrontUri = process.env.CLOUDFRONT_URI;
const cloudFrontKeypairId = process.env.CLOUDFRONT_KEYPAIR_ID;
const cloudFrontPrivateKeyString = process.env.CLOUDFRONT_PRIVATE_KEY || '';

// AWS Simple Email Service credentials
const sesAccessKeyId = process.env.SES_ACCESS_KEY_ID || accessKeyId;
const sesSecretAccessKey = process.env.SES_SECRET_ACCESS_KEY || secretAccessKey;
const sesRegion = process.env.AWS_SES_REGION || region;

const envConfig = {
  aws: {
    accessKeyId,
    secretAccessKey,
    region,
  },
  s3: {
    bucket,
  },
  ACL: {
    publicReadWrite: 'public-read-write',
    publicRead: 'public-read',
    authenticatedRead: 'authenticated-read',
    private: 'private',
    public: 'public',
  },
  cloudFront: {
    uri: cloudFrontUri,
    keypairId: cloudFrontKeypairId,
    privateKeyString: cloudFrontPrivateKeyString,
    expireTime: new Date().getTime() + 8000000000,
  },
  ses: {
    region: sesRegion,
    accessKeyId: sesAccessKeyId,
    secretAccessKey: sesSecretAccessKey,
  },
};

const awsConfig = {
  production: envConfig,
  staging: envConfig,
  development: envConfig,
  test: envConfig,
};

export default awsConfig;
