var webpack = require('webpack');
var path = require('path');
var package = require('./package.json');
var UglifyJsPlugin = webpack.optimize.UglifyJsPlugin;
var env = process.env.WEBPACK_ENV;

var libraryName = package.name;
var config;

if (env === 'production') {
  config = {
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: libraryName + "-" + package.version + '.min.js',
      globalObject: 'this',
      library: {
        name: 'LNR',
        type: 'umd',
        export: 'default' //<--- important
      },
    },
    externals: {
      ethers: {
        commonjs: 'ethers',
        commonjs2: 'ethers',
        amd: 'ethers',
        root: 'ethers',
      },
    },
    optimization: {
        minimize: false
    },
  };

}
module.exports = config;
