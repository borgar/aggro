/* globals module */
module.exports = {
  mode: 'production',
  entry: './src/aggro.js',
  output: {
    library: 'aggro',
    libraryTarget: 'umd',
    filename: 'aggro.js',
    globalObject: 'this'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [ [ 'env', {
              targets: {
                browsers: [
                  '>0.25%', 'not op_mini all'
                ]
              },
              exclude: [ 'transform-es2015-typeof-symbol' ]
            } ] ]
          }
        }
      }
    ]
  }
};
