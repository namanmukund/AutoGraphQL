import { get } from 'lodash';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { ApolloServer, PubSub } from 'apollo-server-express';
import schema from './graphql';
import { log, types } from '../utils';
import { authMiddleware, graphqlUpload } from './middlewares';
import isSentryAppAndEnv from '../utils/isSentryAppAndEnv';
import Raven from './Raven';
import dataExtractedFromReq from '../constants/dataExtractedFromReq';
import { getParsedASTMap } from './autoGenerate/utils';

const http = require('http');

const pubsub = new PubSub();

const port = process.env.PORT || 80;
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
// To pass parsedASTMap in context
const parsedASTMap = getParsedASTMap(types);
// using apollo-server
const server = new ApolloServer({
  schema,
  playground: {
    endpoint: `http://0.0.0.0:${port}${path}`,
    settings: {
      'editor.theme': 'light',
    },
  },
  debug: true,
  uploads: false,
  formatError: (error) => {
    if (error.name !== 'GraphQLError') {
      Raven.captureException(error);
    } else {
      Raven.captureMessage(`Message: ${error.message}`);
    }

    return {
      ...error,
      code: get(error, 'extensions.exception.name') || '',
    };
  },
  context: ({ req, connection }) => {
    if (connection) {
      // context comes in connection in case WS
      return {
        ...connection.context,
        pubsub,
        parsedASTMap,
      };
    }
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

    // initiaize setContext to capture all the useful info before sending any error to sentry
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
    // return context data
    const obj = {};
    dataExtractedFromReq.forEach((data) => {
      obj[data] = req[data];
    });
    return {
      ...obj,
      filePayload,
      pubsub,
      parsedASTMap,
    };
  },
});

server.applyMiddleware({ app });

const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);

httpServer.listen(port, '0.0.0.0', () => {
  log(`Server ready at http://0.0.0.0:${port}${server.graphqlPath}`);
  log(`Subscriptions ready at ws://0.0.0.0:${port}${server.subscriptionsPath}`);
});

export default app;
