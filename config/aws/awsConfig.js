const accessKeyId = 'AKIAJ5KTKINUGBG2KXBA';
const secretAccessKey = '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';
const awsConfig = {
  production: {
    aws: {
      accessKeyId,
      secretAccessKey,
      region: 'us-east-2',
    },
    s3: {
      bucket: 'tekie-tms-staging',
    },
    ACL: {
      publicReadWrite: 'public-read-write',
      publicRead: 'public-read',
      authenticatedRead: 'authenticated-read',
      private: 'private',
      public: 'public',
    },
  },
  staging: {
    aws: {
      accessKeyId,
      secretAccessKey,
      region: 'us-east-2',
    },
    s3: {
      bucket: 'tekie-tms-staging',
    },
    ACL: {
      publicReadWrite: 'public-read-write',
      publicRead: 'public-read',
      authenticatedRead: 'authenticated-read',
      private: 'private',
      public: 'public',
    },
  },
  development: {
    aws: {
      accessKeyId,
      secretAccessKey,
      region: 'us-east-2',
    },
    s3: {
      bucket: 'tekie-dev',
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
      region: 'us-east-2',
    },
    s3: {
      bucket: 'bucket-test',
    },
    ACL: {
      publicReadWrite: 'public-read-write',
      publicRead: 'public-read',
      authenticatedRead: 'authenticated-read',
      private: 'private',
      public: 'public',
    },
  },
};

export default awsConfig;
