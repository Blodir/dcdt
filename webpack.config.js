const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

const config = {
	name: "client",
  mode: 'development',
  devtool: 'inline-source-map',
  entry: './src/playground/v2main.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: path.resolve(__dirname, "tsconfig.json")
            }
          }
        ]
      }
    ]
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ]
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  plugins: [
    new HtmlWebpackPlugin({
			template: './src/playground/index.html'
		})
  ]
};

module.exports = [config];