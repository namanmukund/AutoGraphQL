import app from './app';

const sls = require('serverless-http');
require('./connectDB');

export const handler = sls(app);
