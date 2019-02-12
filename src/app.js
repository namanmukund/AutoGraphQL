import express from 'express';
import cors from 'cors';
import graphqlHTTP from 'express-graphql';
import {
  graphiqlExpress,
} from 'graphql-server-express';
import bodyParser from 'body-parser';
import { formatError } from 'apollo-errors';
import schema from './graphql';
import { log } from '../utils';
import { graphqlUpload, authMiddleware } from './middlewares';
import isSentryAppAndEnv from '../utils/isSentryAppAndEnv';
import Raven from './Raven';

const env = process.env.NODE_ENV || 'development';
const port = process.env.PORT || 3000;
const application = process.env.APPLICATION || 'core';
const debug = process.env.DEBUG || false;
const app = express();


// Must configure Raven before doing anything else with it
if (isSentryAppAndEnv(application, env)) {
  // The request handler must be the first middleware on the app
  app.use(Raven.requestHandler());

  // The error handler must be before any other error middleware
  app.use(Raven.errorHandler());
}

app.get('/', (req, res) => {
  res.send('');
});

app.use(authMiddleware);

// for handling uncaught exceptions
process.on('unhandledRejection', (reason) => {
  log(`Unhandled Exception Occured. Reason: ${JSON.stringify(reason)},${reason}`, 'error');
  // capture unhandledRejection error and send to sentry when env is staging and production
  if (isSentryAppAndEnv(application, env)) {
    Raven.captureException(reason);
  }
});

const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200,
  allowedHeaders: ['Content-Type', 'Authorization', 'Content-Length', 'X-Requested-With', 'X-Forwarded-By'],
};

app.use(cors(corsOptions));

app.use(`/graphql/${application}`,
  bodyParser.json(),
  graphqlUpload({ uploadDir: './uploads' }),
  graphqlHTTP((req, res, params) => {
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
    }
    let formatErrorWrapper;
    const query = params.query;
    const variables = params.variables;
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
        Object.assign(contextObj, {
          extra: {
            appInfo: req.currentApp,
            query,
            variables,
          },
          tags: {
            app: req.currentApp.name,
          },
        });
      }
      Raven.setContext(contextObj);
    }
    if ((env === 'test' || env === 'testBackend') && !debug) {
      formatErrorWrapper = formatError;
    } else {
      formatErrorWrapper = (error) => {
        // capture graphql error and send to sentry when env is staging and production
        if (isSentryAppAndEnv(application, env)) {
          if (error.path || error.name !== 'GraphQLError') {
            Raven.captureException(error);
          } else {
            Raven.captureMessage(`Message: ${error.message}`);
          }
        }
        // logging for errors
        log(JSON.stringify(query), 'Graphql Query');
        if (variables) {
          log(JSON.stringify(variables), 'Graphql Variables');
        }
        log(error, 'GraphQL Error');

        return formatError(error);
      };
    }
    return {
      formatError: formatErrorWrapper,
      schema,
      context: {
        decodedUser: req.currentUser,
        decodedApp: req.currentApp,
        filePayload,
        mutationCallRoute: req.mutationCallRoute,
        authorization: req.authorization,
        xForwardedBy: req.xForwardedBy,
      },
      graphiql: (env !== 'production'),
      pretty: (env !== 'production'),
    };
  }));

app.listen(port, () => {
  log(`GraphQL Server running on port: ${port}`);
});

app.use('/graphiql', graphiqlExpress({
  endpointURL: '/graphql',
}));


export default app;
