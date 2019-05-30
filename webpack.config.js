const path = require('path');

module.exports = {
  entry: './build/src/index-web.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  }
};
