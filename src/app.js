import { get } from 'lodash';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { ApolloServer } from 'apollo-server-express';
import { BaseRedisCache } from 'apollo-server-cache-redis';
import { WebSocketServer } from 'ws';
import { useServer as useSocketServer } from 'graphql-ws/lib/use/ws';
import schema from './graphql';
import { log, types } from '../utils';
import { authMiddleware, graphqlUpload } from './middlewares';
import isAPMEnabledAppAndEnv from '../utils/isAPMEnabledAppAndEnv';
import APM from './APM';
import dataExtractedFromReq from '../constants/dataExtractedFromReq';
import { getParsedASTMap } from './autoGenerate/utils';
import phonePeRoutes from './externalProductAPI/phonePe/routes';
import iciciRoutes from './externalProductAPI/icici/routes';
import typeformRoute from './typeformAPI';
import redis from './redis';
import pubsub from './pubsub';
import { ALLOWED_HEADERS, TBA } from '../constants';
import getAdditionalContextData from '../utils/getAdditionalContextData';

const http = require('http');

const port = process.env.PORT || 80;
const env = process.env.NODE_ENV || 'development';
const application = process.env.APPLICATION || 'core';

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

phonePeRoutes(app);
iciciRoutes(app);
typeformRoute(app);

app.get('/favicon.ico', (req, res) => res.status(204).end());
app.get('/robots.txt', (req, res) => res.status(204).end());

const path = `/graphql/${application}`;

APM.setRequestAndTracingHandlers(app);

// for handling uncaught exceptions
process.on('unhandledRejection', (reason) => {
  log(`Unhandled Exception Occured. Reason: ${JSON.stringify(reason)},${reason}`, 'error');
  // capture unhandledRejection error and send to APM when env is production
  APM.captureException(reason);
});

app.get('/', (req, res) => {
  res.send('');
});

app.use(authMiddleware);

const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200,
  allowedHeaders: ALLOWED_HEADERS,
};

app.use(cors(corsOptions));

// Create the schema, which will be used separately by ApolloServer and
// the WebSocket server.

app.use(path, bodyParser.json(), graphqlUpload({ uploadDir: '/tmp/uploads' }));

APM.setErrorHandler(app);

// To pass parsedASTMap in context
const parsedASTMap = getParsedASTMap(types);

const httpServer = http.createServer(app);

const webSocketServer = new WebSocketServer({
  server: httpServer,
  path,
});

const socketServer = useSocketServer({
  schema,
  context: (ctx) => {
    let additionalContextDataFromHeader = {};
    if (get(ctx, 'extra.request.headers')) {
      additionalContextDataFromHeader = getAdditionalContextData({ headers: get(ctx, 'extra.request.headers') });
    }
    return {
      ...ctx,
      pubsub,
      parsedASTMap,
      redis,
      ...additionalContextDataFromHeader,
    };
  },
}, webSocketServer);

const socketServerPlugin = {
  async serverWillStart() {
    return {
      async drainServer() {
        await socketServer.dispose();
      },
    };
  },
};

// using apollo-server
const server = new ApolloServer({
  schema,
  introspection: process.env.ENABLE_GRAPHQL_INTROSPECTION,
  playground: {
    endpoint: `http://0.0.0.0:${port}${path}`,
    settings: {
      'editor.theme': 'light',
    },
  },
  plugins: [socketServerPlugin, ...APM.getPluginsForApollo()],
  debug: true,
  uploads: false,
  cache: new BaseRedisCache({
    client: redis,
  }),
  cacheControl: {
    defaultMaxAge: 5,
  },
  formatError: (error) => {
    const apolloErrorObject = Object.create(error);
    apolloErrorObject.stack = error.extensions.exception.stacktrace.join('\n');
    if (error.name !== 'GraphQLError') {
      APM.captureException(apolloErrorObject);
    } else {
      // APM.captureMessage(`Message: ${error.message}`);
    }
    return {
      ...error,
      code: get(error, 'extensions.exception.name') || '',
    };
  },
  context: ({ req, res, connection }) => {
    let additionalContextDataFromHeader = {};
    if (req && req.headers) {
      additionalContextDataFromHeader = getAdditionalContextData({
        headers: req.headers,
      });
    }
    if (connection) {
      // context comes in connection in case WS
      return {
        ...connection.context,
        pubsub,
        parsedASTMap,
        redis,
        res,
        ...additionalContextDataFromHeader,
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

    // initiaize setContext to capture all the useful info before sending any error to APM
    if (isAPMEnabledAppAndEnv(application, env)) {
      const contextObj = {};
      // if userId available then send the id to APM
      if (req.currentUser) {
        const { id } = req.currentUser;
        Object.assign(contextObj, {
          user: {
            id,
          },
        });
      }
      // if appInfo available then send the info to APM
      if (req.currentApp) {
        Object.assign(contextObj, {
          extra: {
            appInfo:
              typeof req.currentApp === 'object'
              && typeof req.currentApp !== 'string'
                ? JSON.stringify(req.currentApp)
                : req.currentApp,
          },
          tags: {
            app: req.currentApp.name,
          },
        });
      }
      APM.setUser(get(req, 'currentUser'));
      APM.setContext('context', contextObj);
      APM.setTags([
        { label: 'app', value: get(req, 'currentApp.name') || TBA },
      ]);
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
      redis,
      res,
      ...additionalContextDataFromHeader,
    };
  },
});

server.applyMiddleware({ app });

httpServer.listen(port, '0.0.0.0', () => {
  log(`End time:${new Date()}`, 'status');
  log(`Server ready at http://0.0.0.0:${port}${server.graphqlPath}`, 'status');
  log(`Subscriptions ready at ws://0.0.0.0:${port}${server.subscriptionsPath}`, 'status');
});

export default app;
