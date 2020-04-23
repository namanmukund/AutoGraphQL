const application = process.env.APPLICATION || 'core';
const applicationHost = process.env.CORE_APPLICATION_HOST || 'localhost';
const port = process.env.PORT || '3000';
const config = {
  test: {
    // server connection settings
    backend: {
      applicationHost,
      port,
      uri: `http://${applicationHost}:${port}/graphql/${application}`,
    },
  },
  development: {
    // server connection settings
    backend: {
      applicationHost,
      port,
      uri: `http://${applicationHost}:${port}/graphql/${application}`,
    },
  },
  staging: {
    // server connection settings
    backend: {
      applicationHost,
      port,
      uri: `http://${applicationHost}:${port}/graphql/${application}`,
    },
  },
};

export default config;
