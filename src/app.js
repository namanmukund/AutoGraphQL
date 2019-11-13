import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { ApolloServer } from 'apollo-server-express';
import schema from './graphql';
import { log } from '../utils';
import { graphqlUpload, authMiddleware } from './middlewares';

const port = process.env.PORT || 3000;
const application = process.env.APPLICATION || 'core';
const app = express();

const path = `/graphql/${application}`;

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

    return {
      decodedUser: req.currentUser,
      decodedApp: req.currentApp,
      filePayload,
      mutationCallRoute: req.mutationCallRoute,
      authorization: req.authorization,
      xForwardedBy: req.xForwardedBy,
    };
  },
});

server.applyMiddleware({ app, path });

app.listen(port, () => {
  log(`Server ready at http://localhost:${port}${server.graphqlPath}`);
});

export default app;
