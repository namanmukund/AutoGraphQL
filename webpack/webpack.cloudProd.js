/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/extensions */
// const webpack = require('webpack');
const merge = require('webpack-merge');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const SentryCliPlugin = require('@sentry/webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const packageJson = require('../package.json');
/* eslint-enable import/no-extraneous-dependencies */

const common = require('./webpack.cloudCommon');

const release = packageJson.version || 'norelease';
const environment = process.env.NODE_ENV || 'development';

const eslintOptions = {
  extensions: ['js'],
  exclude: ['/node_modules/'],
  failOnError: false,
};

module.exports = merge(common, {
  devtool: 'source-map',
  mode: environment === 'production' ? environment : 'development',
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
    new ESLintPlugin(eslintOptions),
  ],
});
