/* global process */

const path = require("path");
const webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const childProcess = require("child_process");
const packageVersion = require("./package.json").version;
const buildVersion = childProcess
  .execSync("git rev-list HEAD --count")
  .toString()
  .trim();

function normalizeBaseUrl(raw) {
  if (!raw || raw === "/") {
    return "/";
  }
  let base = raw;
  if (!base.startsWith("/")) {
    base = `/${base}`;
  }
  if (!base.endsWith("/")) {
    base += "/";
  }
  return base;
}

const baseUrl = normalizeBaseUrl(process.env.BASE_URL);

function makeConfig(mode) {
  let config = {
    entry: ["./src/js/app.js", "./src/scss/app.scss"],

    target: "web",

    output: {
      path: path.resolve("dist"),
      filename: "js/[name].js",
      publicPath: baseUrl,
      clean: true,
    },

    module: {
      rules: [
        {
          test: /\.(woff(2)?|eot|ttf|otf|svg|png)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
          type: "asset",
          parser: {
            dataUrlCondition: {
              maxSize: 8 * 1024,
            },
          },
          generator: {
            filename: "assets/[hash][ext][query]",
          },
        },
        {
          test: /\.scss$/,
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
              options: {
                esModule: false,
                publicPath: "../",
              },
            },
            "css-loader",
            "sass-loader",
          ],
        },
      ],
    },

    plugins: [
      new HtmlWebpackPlugin({
        template: "./src/index.html",
        inject: "body",
        scriptLoading: "blocking",
        templateParameters: {
          BASE_URL: baseUrl,
        },
      }),
      new CopyPlugin({
        patterns: [
          { from: "src/favicon.svg", to: "favicon.svg" },
          {
            from: "src/assets/forkme_right_gray.png",
            to: "assets/forkme_right_gray.png",
          },
        ],
      }),
      new MiniCssExtractPlugin({
        filename: "css/[name].css",
      }),
      new webpack.DefinePlugin({
        BUILD_VERSION: JSON.stringify(`${packageVersion}.${buildVersion}`),
        BASE_URL: JSON.stringify(baseUrl),
      }),
    ],
  };

  if (mode === "development") {
    config.devtool = "source-map";
    config.output.sourceMapFilename = "[file].map";
  }

  return config;
}

module.exports = (_env, argv) => {
  return makeConfig(argv.mode);
};