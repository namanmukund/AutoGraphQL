import { log } from '../utils';

/* eslint-disable no-unused-vars */
log(`Start time:${new Date()}`, 'status');
require('./server');
// Intantiate App.
require('./cloudApp');
