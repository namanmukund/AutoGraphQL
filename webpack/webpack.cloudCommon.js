/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/extensions */
const nodeExternals = require('webpack-node-externals');
/* eslint-enable import/no-extraneous-dependencies */
const path = require('path');

// -- Webpack configuration --

const config = {};

// Application entry point
config.entry = './src/serverCloud.js';

// We build for node
config.target = 'node';

config.externals = [nodeExternals()];

// We are outputting a real node app!
config.node = {
  console: false,
  global: false,
  process: false,
  Buffer: false,
  __filename: false,
  __dirname: true,
};

// Output files in the build/ folder
config.output = {
  path: path.join(__dirname, '../build'),
  filename: '[name]Cloud.js',
};

config.resolve = {
  extensions: [
    '.js',
    '.json',
  ],
};

config.module = {};

config.module.rules = [

  // Use babel and eslint to build and validate JavaScript
  {
    test: /\.js$/,
    exclude: /node_modules/,
    use: [
      {
        loader: 'babel-loader',
      },
      {
        loader: 'eslint-loader',
      },
    ],
  },
];

module.exports = config;
