const awsConfig = {
  production: {
    aws: {
      accessKeyId: 'AKIAIZKYV2S3WCCTWNYA',
      secretAccessKey: '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',
      region: 'us-east-2',
    },
    s3: {
      bucket: 'bucket-staging',
    },
    ACL: {
      publicReadWrite: 'public-read-write',
      publicRead: 'public-read',
      authenticatedRead: 'authenticated-read',
      private: 'private',
    },
  },
  staging: {
    aws: {
      accessKeyId: 'AKIAIZKYV2S3WCCTWNYA',
      secretAccessKey: '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',
      region: 'us-east-2',
    },
    s3: {
      bucket: 'bucket-staging',
    },
    ACL: {
      publicReadWrite: 'public-read-write',
      publicRead: 'public-read',
      authenticatedRead: 'authenticated-read',
      private: 'private',
    },
  },
  development: {
    aws: {
      accessKeyId: 'AKIAIZKYV2S3WCCTWNYA',
      secretAccessKey: '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',
      region: 'us-east-2',
    },
    s3: {
      bucket: 'bucket-dev',
    },
    ACL: {
      publicReadWrite: 'public-read-write',
      publicRead: 'public-read',
      authenticatedRead: 'authenticated-read',
      private: 'private',
    },
  },
  test: {
    aws: {
      accessKeyId: 'AKIAIZKYV2S3WCCTWNYA',
      secretAccessKey: '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',
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
    },
  },
};

export default awsConfig;
