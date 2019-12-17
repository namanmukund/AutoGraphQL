import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { ApolloServer } from 'apollo-server-express';
import schema from './graphql';
import { log } from '../utils';
import { graphqlUpload, authMiddleware } from './middlewares';
import isSentryAppAndEnv from '../utils/isSentryAppAndEnv';
import Raven from './Raven';

const port = process.env.PORT || 3000;
const env = process.env.NODE_ENV || 'development';
const application = process.env.APPLICATION || 'core';

const app = express();

const path = `/graphql/${application}`;

// Must configure Raven before doing anything else with it
if (isSentryAppAndEnv(application, env)) {
  // The request handler must be the first middleware on the app
  app.use(Raven.requestHandler());

  // The error handler must be before any other error middleware
  app.use(Raven.errorHandler());
}

// for handling uncaught exceptions
process.on('unhandledRejection', (reason) => {
  log(`Unhandled Exception Occured. Reason: ${JSON.stringify(reason)},${reason}`, 'error');
  // capture unhandledRejection error and send to sentry when env is staging and production
  if (isSentryAppAndEnv(application, env)) {
    Raven.captureException(reason);
  }
});

app.get('/', (req, res) => {
  res.send('');
});

app.use(authMiddleware);

const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200,
  allowedHeaders: ['Content-Type', 'Authorization', 'Content-Length', 'X-Requested-With', 'X-Forwarded-By'],
};

app.use(cors(corsOptions));

app.use(path, bodyParser.json(), graphqlUpload({ uploadDir: '/tmp/uploads' }));

// using apollo-server
const server = new ApolloServer({
  schema,
  playground: {
    endpoint: `http://localhost:${port}${path}`,
    settings: {
      'editor.theme': 'light',
    },
  },
  uploads: false,
  formatError: (error) => {
    if (error.name !== 'GraphQLError') {
      Raven.captureException(error);
    } else {
      Raven.captureMessage(`Message: ${error.message}`);
    }
    return error;
  },
  context: ({ req }) => {
    // file info from middleware
    let filePayload = '';
    if (req.body && req.body.variables) {
      if (req.body.variables.fileInput) {
        filePayload = req.body.variables.fileInput.filePayload;
        delete req.body.variables.fileInput.filePayload;
      } else if (req.body.variables.filePayload) {
        filePayload = req.body.variables.filePayload;
        delete req.body.variables.filePayload;
      }
    } else if (req.body && (!req.body.variables || req.body.variables === '')) {
      // To avoid apollo-server-core error
      req.body.variables = {};
    }


    const contextData = {
      decodedUser: req.currentUser,
      decodedApp: req.currentApp,
      filePayload,
      mutationCallRoute: req.mutationCallRoute,
      authorization: req.authorization,
      xForwardedBy: req.xForwardedBy,
    };

    // initiaize setContext before sending any error to sentry
    if (isSentryAppAndEnv(application, env)) {
      const contextObj = {};
      // if userId available then send the id to sentry
      if (req.currentUser) {
        const { id } = req.currentUser;
        Object.assign(contextObj, {
          user: {
            id,
          },
        });
      }
      // if appInfo available then send the info to sentry
      if (req.currentApp) {
        console.log(334444, req.body);
        Object.assign(contextObj, {
          extra: {
            appInfo: req.currentApp,
            query: req.body.query,
            variables: req.body.variables,
          },
          tags: {
            app: req.currentApp.name,
          },
        });
      }
      Raven.setContext(contextObj);
    }
    return contextData;
  },
});

server.applyMiddleware({ app, path });

app.listen(port, () => {
  log(`Server ready at http://localhost:${port}${server.graphqlPath}`);
});

export default app;
