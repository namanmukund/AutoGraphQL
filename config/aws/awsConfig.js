const accessKeyId = 'AKIAU6O7VDUCZQAL4Z6T';
const secretAccessKey = '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';
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
  },
};

export default awsConfig;
