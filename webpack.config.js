const path = require("path");

module.exports = {
  entry: "./src/index.ts",
  target: "webworker",
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".js", ".ts"],
  },
  output: { path: path.resolve(__dirname, "worker"), filename: "script.js" },
  performance: { hints: false },
  mode: "production",
  node: {
    fs: "empty",
    tls: "empty",
    net: "empty",
  },
};
