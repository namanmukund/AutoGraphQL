/**
* @type {import('stellate').Config}
*/
const config = {
  config: {
    scopes: {
      AUTHENTICATED: 'header:authorization',
    },
    rootTypeNames: {
      query: 'Query',
      mutation: 'Mutation',
    },
    rules: [
      {
        types: {
          Query: [
            'topic',
            'course',
            'topics',
            'chapter',
            'courses',
            'chapters',
            'coursePackage',
            'coursePackages',
          ],
        },
        maxAge: 604800,
        swr: 259200,
      },
    ],
    name: 'tekie-backend',
    originUrl: 'https://api.tekie.in/graphql/core',
  },
};

export default config;
