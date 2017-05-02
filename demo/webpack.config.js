const BabiliPlugin = require("babili-webpack-plugin");
module.exports = {
  entry: './main.js',
  output: {
      filename: 'main.min.js'
  },
  plugins: [
    new BabiliPlugin()
  ]
}