"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _react = _interopRequireDefault(require("react"));

var _gatsby = require("gatsby");

var _defaults = _interopRequireDefault(require("./defaults"));

var _jsxFileName = "/Users/aileen/code/gatsby-plugin-advanced-sitemap/src/gatsby-ssr.js";

exports.onRenderBody = function (_ref, pluginOptions) {
  var setHeadComponents = _ref.setHeadComponents;

  var _defaultOptions$plugi = (0, _extends2.default)({}, _defaults.default, pluginOptions),
      createLinkInHead = _defaultOptions$plugi.createLinkInHead;

  if (!createLinkInHead) {
    return;
  }

  setHeadComponents([_react.default.createElement("link", {
    key: "gatsby-plugin-advanced-sitemap",
    rel: "sitemap",
    type: "application/xml",
    href: (0, _gatsby.withPrefix)("/sitemap.xml"),
    __source: {
      fileName: _jsxFileName,
      lineNumber: 13
    },
    __self: this
  })]);
};