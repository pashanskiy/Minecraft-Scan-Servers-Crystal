const path = require("path")
const MiniCssExtractPlugin = require('mini-css-extract-plugin')


module.exports = {
  mode: "development",
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  plugins: [new MiniCssExtractPlugin({filename: 'styles.css'})],
  module: {
    rules: [
      {
        test: /\.tsx$/i,
        exclude: /node_modules/,
        use: ["babel-loader"]
      },
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
    ]
  },
  resolve: {
    modules: [
      path.join(__dirname, "js/helpers"),
      "node_modules"
    ],
    extensions: ['.ts', '.tsx','.js'],
}
};