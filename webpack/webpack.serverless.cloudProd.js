/* eslint-disable import/no-extraneous-dependencies */
// const webpack = require('webpack');
const merge = require('webpack-merge');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
/* eslint-enable import/no-extraneous-dependencies */

const common = require('./webpack.serverless.cloudCommon.js');


module.exports = merge(common, {
  devtool: 'source-map',
  target: 'node',
  plugins: [
    new UglifyJSPlugin({
      sourceMap: true,
    }),
    // new webpack.IgnorePlugin(/schema\.json/),
    new CopyWebpackPlugin([
      {
        from: 'static',
        to: 'static',
      },
    ]),
  ],
});
