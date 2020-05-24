/* eslint-disable import/no-extraneous-dependencies */
// const webpack = require('webpack');
const merge = require('webpack-merge');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const SentryCliPlugin = require('@sentry/webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const packageJson = require('../package.json');
/* eslint-enable import/no-extraneous-dependencies */

const common = require('./webpack.cloudCommon.js');

const release = packageJson.version || 'norelease';
const environment = process.env.NODE_ENV || 'development';

module.exports = merge(common, {
  devtool: 'source-map',
  mode: environment,
  target: 'node',
  plugins: [
    new UglifyJSPlugin({
      sourceMap: true,
    }),
    // new webpack.IgnorePlugin(/schema\.json/),
    new SentryCliPlugin({
      include: './build',
      release,
      ignoreFile: '.sentrycliignore',
      ignore: ['node_modules', 'webpack.config.js', 'static'],
      configFile: `config/sentry/properties/sentry.properties.${environment}`,
    }),
    new CopyWebpackPlugin([
      {
        from: 'static',
        to: 'static',
      },
    ]),
  ],
});
