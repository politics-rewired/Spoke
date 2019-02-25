require('dotenv').config()

const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
var path = require('path');
var fs = require('fs');

var nodeModules = {};
fs.readdirSync('node_modules')
  .filter(function(x) {
    return ['.bin'].indexOf(x) === -1;
  })
  .forEach(function(mod) {
    nodeModules[mod] = 'commonjs ' + mod;
  });


module.exports = {
    entry: './lambda.js',
    plugins: [
        new UglifyJsPlugin()
      ],
    output: {
      filename: 'bundle.js',
      libraryTarget: "umd"
    },
    externals: nodeModules,

    module: {
      rules: [
        {
          test: /\.js$/,
          include: /src/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: ['env']
            }
          }
        }
      ]
    }
};
