const environment = process.env.NODE_ENV || 'development';

const commonParams = {
  TOKEN_EXPIRY_DATE: '1y',
  FORGOT_PASSWORD_EXPIRY_DATE: '1h',
  FRONTEND_STATIC_APP_TOKEN_EXPIRY_DATE: '10y',
  BACKEND_STATIC_APP_TOKEN_EXPIRY_DATE: '10y',
  SUPER_ADMIN_TOKEN_EXPIRY_DATE: '2h',
  ALGORITHM: 'HS256',
  SALT: 12,
  OTP_EXPIRATION_TIME_IN_SEC: 300,
};

const coreAuthParams = {
  test: {
    SECRET: 'bdfkaevfkadvsfvbkfjbsdfbsbdkfbkdsvzxnalhdfjhzvmvb.kfbKJVBkdsBVKJbksdvkljbls',
    FORGOT_PASSWORD_SECRET: 'cludfkpnawdiesxndhlzpukfdhslabfbnesjqlahcnxpmritb.bajDKXPyjoWBKVydlpbzmehap',
    ...commonParams,
  },
  development: {
    SECRET: 'bdfkaevfkadvsfvbkfjbsdfbsbdkfbkdsvzxnalhdfjhzvmvb.kfbKJVBkdsBVKJbksdvkljbls',
    FORGOT_PASSWORD_SECRET: 'cludfkpnawdiesxndhlzpukfdhslabfbnesjqlahcnxpmritb.bajDKXPyjoWBKVydlpbzmehap',
    ...commonParams,
  },
  staging: {
    SECRET: 'bdfkaevfkadvsfvbkfjbsdfbsbdkfbkdsvzxnalhdfjhzvmvb.kfbKJVBkdsBVKJbksdvkljbls',
    FORGOT_PASSWORD_SECRET: 'cludfkpnawdiesxndhlzpukfdhslabfbnesjqlahcnxpmritb.bajDKXPyjoWBKVydlpbzmehap',
    ...commonParams,
  },
};

export default coreAuthParams[environment];
