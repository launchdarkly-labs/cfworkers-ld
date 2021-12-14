module.exports = {
  entry: "./workers-site/index.js",
  target: "webworker",
  node: {
    fs: "empty",
    tls: "empty",
    net: "empty",
  },
};
