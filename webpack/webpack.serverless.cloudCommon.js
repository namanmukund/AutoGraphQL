/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/extensions */
const nodeExternals = require('webpack-node-externals');
const slsw = require('serverless-webpack');

/* eslint-enable import/no-extraneous-dependencies */
const path = require('path');

// -- Webpack configuration --

const config = {};
config.performance = { hints: false };

// Application entry point
config.entry = slsw.lib.entries;

// We build for node
config.mode = 'development';
config.optimization = {
  minimize: false,
};

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
  libraryTarget: 'commonjs2',
  path: path.join(__dirname, '../build'),
  filename: '[name].js',
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
    ],
  },
];

module.exports = config;
