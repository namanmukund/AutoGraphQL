const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const cloudFrontUri = process.env.CLOUDFRONT_URI;
const cloudFrontKeypairId = process.env.CLOUDFRONT_KEYPAIR_ID;
const cloudFrontPrivateKeyString = process.env.CLOUDFRONT_PRIVATE_KEY_STRING;


const awsConfig = {
  production: {
    aws: {
      accessKeyId,
      secretAccessKey,
      region: 'us-east-1',
    },
    s3: {
      bucket: 'tekie-tms-test',
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
  },
  staging: {
    aws: {
      accessKeyId,
      secretAccessKey,
      region: 'us-east-1',
    },
    s3: {
      bucket: 'tekie-tms-test',
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
  },
  development: {
    aws: {
      accessKeyId,
      secretAccessKey,
      region: 'us-east-1',
    },
    s3: {
      bucket: 'tekie-tms-test',
    },
    cloudFront: {
      uri: cloudFrontUri,
      keypairId: cloudFrontKeypairId,
      privateKeyString: cloudFrontPrivateKeyString,
      expireTime: new Date().getTime() + 8000000000,
    },
    ACL: {
      publicReadWrite: 'public-read-write',
      publicRead: 'public-read',
      authenticatedRead: 'authenticated-read',
      private: 'private',
      public: 'public',
    },
  },
  test: {
    aws: {
      accessKeyId,
      secretAccessKey,
      region: 'us-east-1',
    },
    s3: {
      bucket: 'tekie-tms-test',
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
  },
};

export default awsConfig;
