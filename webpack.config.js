const webpack = require("webpack");
const path = require("path");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");

module.exports = {
    devtool: "source-map",
    entry: [path.join(__dirname, "src", "DEQcore.js")],
    output: {
        path: path.join(__dirname, "build"),
        filename: "DEQcore.min.js",
        sourceMapFilename: "DEQ.js.map"
    },
    optimization: {
        minimizer: [
            new UglifyJsPlugin()
        ]
    }
};
