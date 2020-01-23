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
    cloudFront : {
      uri: 'dijvw6rlprlv2.cloudfront.net',
      keypairId: 'APKAJ5UVLD3I2PPQCKAQ',
      privateKeyString: '-----BEGIN RSA PRIVATE KEY-----\n' +
        'MIIEpAIBAAKCAQEAjetoFQGmFh5aSo/HR6SU45hXr0C2/2qbSwJ5xB5/1owWglj0\n' +
        '+TISqR+qcS4bAFWFkvNqTX5ZeMVjMGoayihtuuPzjKQa3pydKpMwUG9lDGYaR4xA\n' +
        'VeHZTY5fGnCJ0UPoOZ/5MCNNOFtwO4vJf9rTf1FEU6hNy7prjEMVBjf1rS+uIG41\n' +
        'TCsouN+zZAGrENuyCEfXMEJxPGPY9YBxk/fGDhmspjtafcZcYJ57gDecZejBPpzR\n' +
        'g0N4xnZhmBp4sv17oSPdhBatu7a3lC0h89bxiRoju7SMM82Gu0tEEwj7LGm2HpWW\n' +
        '31nzhn6CDXdNPEM49Y+YbbbUzfvzvyMlBLUk+QIDAQABAoIBABOkFr2BgujgvoI/\n' +
        'L8c8gdaVyNzaSflDWcahyxRXXD3nGV5kzVKHmYmKdl4/kUEUlO3nfjjHWb6bIsUa\n' +
        'iiacPcN1tMksFQPmDOJNiIw5PnTe1Jg+UtEP9rEDGSphlNE/Yq5G84ez+wXnsbqr\n' +
        '9/EX6dle9+PUESA25pd82TYJHJkhIVYwF6tmXhlDZUuKn3BsCdzzTEO5jGTE891g\n' +
        'T08hHH0szMhLtjJsNoM7oFfcUWWrd3FpNChSFTcrVFbMldW04iNKXkHnBOtfLhXz\n' +
        'gjgH38oq0p8IPTK+RkQAw8Ba1d14SKeknmnQ2YRMU5Nj3RpYWEnKoB2j1a7+x32q\n' +
        '5lg/YwECgYEAyJUPcq3ncqGGyJ4zfvHBJtMVqz8wFL7EspMbwb3rIapArfERjkPY\n' +
        '7j4gdOeNIxczWRMRQJV1pUKjz9I0L6mrYu75swHl6Itk8R30/oPIxLnMiL7VUD1K\n' +
        'BbdWvK5av+qM6Zzm5uVU0AmelJEp/kbETL8RDdGMwaZXfsauiDayi5ECgYEAtSE0\n' +
        'Qe1LEF1qdQxetnNXcfJiEDIp5cSKhyFNPado8spv4vW6WhS3J9BallUFNa5PbVa2\n' +
        'B1FRevdcJswGyFKSgpdHwi5+7hqVXGrFe+hY63CQIzSQT5RrM7pQxlwVamJflvAP\n' +
        '8unz4kF+cT9aG889ByK2CMSVdiT56IK/ID53PukCgYEAtKq+jVbif7fKBW2piJAM\n' +
        'oAHFJMf3cNgbp5UljS6ZWWtWctYOMAwgmwbOiT3/PDorf/HSuk9k9gO+NPRrGPtE\n' +
        'agpCUuBEy16y/xMylwTwk3GfLxRkYq+xutBWigCpsO99GPbAa/zolbH0anEOWAA5\n' +
        '077Nh5rVo59Gc+RVVE+gJmECgYB3sv/D6btHj1SBEbGtxT+ur82agmwpyd76Okm/\n' +
        'StkSSjHyvQ1v5my7xPd4jasptI4M5dbZsyWzq7CcewyoadkksDDd5LhBRhQaxPzJ\n' +
        'S90ninXWrjAIRz8pKiGjVMtaSLR/HRqNH4rqpPmYgZNc+XGNO6Us2i0jrH/y5iTE\n' +
        'fEN1sQKBgQCPrL0COiH/ExSQC6Cl8FMI+K+KoTBBByx/HVyjp3O/uDDXJmDABV/X\n' +
        '868tY+Msmof9svCiDsKLRqMF5cq6oxctM0lDdYi9u7hgV8n1vRttxNPm5sj8i5s0\n' +
        'hL4nMmX3PSuDBRv0YHlIrm/A/mGCOx3Lt3ps9lFUahbVj6wIQp0CIw==\n' +
        '-----END RSA PRIVATE KEY-----',
      expireTime: new Date().getTime() + 8000000000

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
