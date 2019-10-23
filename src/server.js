/* eslint-disable no-unused-vars */

// Requires are for running in production mode.
require('@babel/polyfill');

// Check app inheritance.
const inherit = require('./inherit');

const appInheritanceCheck = inherit.default;

const application = process.env.APPLICATION || 'core';
const env = process.env.NODE_ENV || 'development';
const inheritedApplications = process.env.INHERITED_APPLICATIONS || '';
appInheritanceCheck(env, application, inheritedApplications);
