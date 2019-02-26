"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.onPostBuild = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _path = _interopRequireDefault(require("path"));

var _url = _interopRequireDefault(require("url"));

var _fsExtra = _interopRequireDefault(require("fs-extra"));

var _lodash = _interopRequireDefault(require("lodash"));

var _defaults = _interopRequireDefault(require("./defaults"));

var _SiteMapManager = _interopRequireDefault(require("./SiteMapManager"));

var PUBLICPATH = "./public";
var INDEXFILE = "/sitemap.xml";
var RESOURCESFILE = "/sitemap-:resource.xml";

var XSLFILE = _path.default.resolve(__dirname, "./static/sitemap.xsl");

var DEFAULTQUERY = "{\n  allSitePage {\n    edges {\n      node {\n        id\n        slug: path\n        url: path\n      }\n    }\n  }\n  site {\n    siteMetadata {\n      siteUrl\n    }\n  }\n}";
var DEFAULTMAPPING = {
  allSitePage: {
    name: "pages",
    path: "/",
    source: "pages"
  }
};
var siteUrl;

var copyStylesheet =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref) {
    var siteUrl, indexOutput, siteRegex, data, sitemapStylesheet;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            siteUrl = _ref.siteUrl, indexOutput = _ref.indexOutput;
            siteRegex = /(\{\{blog-url\}\})/g; // Get our stylesheet template

            _context.next = 4;
            return _fsExtra.default.readFile(XSLFILE);

          case 4:
            data = _context.sent;
            // Replace the `{{blog-url}}` variable with our real site URL
            sitemapStylesheet = data.toString().replace(siteRegex, _url.default.resolve(siteUrl, indexOutput)); // Save the updated stylesheet to the public folder, so it will be
            // available for the xml sitemap files

            _context.next = 8;
            return _fsExtra.default.writeFile(_path.default.join(PUBLICPATH, "sitemap.xsl"), sitemapStylesheet);

          case 8:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));

  return function copyStylesheet(_x) {
    return _ref2.apply(this, arguments);
  };
}();

var serializeMarkdownNodes = function serializeMarkdownNodes(node) {
  if (!node.fields.slug) {
    throw Error("`slug` is a required field");
  }

  node.slug = node.fields.slug;
  delete node.fields.slug;

  if (node.frontmatter) {
    if (node.frontmatter.published_at) {
      node.published_at = node.frontmatter.published_at;
      delete node.frontmatter.published_at;
    }

    if (node.frontmatter.feature_image) {
      node.feature_image = node.frontmatter.feature_image;
      delete node.frontmatter.feature_image;
    }
  }

  return node;
};

var getNodePath = function getNodePath(node, allSitePage, sitePrefix, pathPrefix) {
  if (!node.slug) {
    return node;
  }

  var slugRegex = new RegExp(node.slug.replace(/\/$/, "") + "$", "gi");
  node.path = _path.default.join(sitePrefix, pathPrefix, node.slug);

  for (var _iterator = allSitePage.edges, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
    var _ref3;

    if (_isArray) {
      if (_i >= _iterator.length) break;
      _ref3 = _iterator[_i++];
    } else {
      _i = _iterator.next();
      if (_i.done) break;
      _ref3 = _i.value;
    }

    var page = _ref3;

    if (page.node && page.node.url && page.node.url.replace(/\/$/, "").match(slugRegex)) {
      node.path = page.node.url;
      break;
    }
  }

  return node;
}; // Add all other URLs that Gatsby generated, using siteAllPage,
// but we didn't fetch with our queries


var addPageNodes = function addPageNodes(parsedNodesArray, allSiteNodes, siteUrl) {
  var parsedNodes = parsedNodesArray[0];
  var pageNodes = [];
  var addedPageNodes = {
    pages: []
  };
  var usedNodes = allSiteNodes.filter(function (_ref4) {
    var node = _ref4.node;
    var foundOne;

    for (var type in parsedNodes) {
      parsedNodes[type].forEach(function (fetchedNode) {
        if (node.url === fetchedNode.node.path) {
          foundOne = true;
        }
      });
    }

    return foundOne;
  });

  var remainingNodes = _lodash.default.difference(allSiteNodes, usedNodes);

  remainingNodes.forEach(function (_ref5) {
    var node = _ref5.node;
    addedPageNodes.pages.push({
      url: _url.default.resolve(siteUrl, node.url),
      node: node
    });
  });
  pageNodes.push(addedPageNodes);
  return pageNodes;
};

var serializeSources = function serializeSources(mapping) {
  var sourceNames = [];

  for (var resourceType in mapping) {
    sourceNames.push(mapping[resourceType]);
  }

  sourceNames = _lodash.default.map(sourceNames, function (source) {
    // Ignore the key and only return the name and
    // source as we need those to create the index
    // and the belonging sources accordingly
    return {
      name: source.name,
      source: source.source
    };
  });
  sourceNames = _lodash.default.uniqBy(sourceNames, "name");
  return sourceNames;
};

var runQuery = function runQuery(handler, _ref6) {
  var query = _ref6.query,
      exclude = _ref6.exclude;
  return handler(query).then(function (r) {
    if (r.errors) {
      throw new Error(r.errors.join(", "));
    }

    var _loop = function _loop(source) {
      // Removing excluded paths
      if (r.data[source] && r.data[source].edges && r.data[source].edges.length) {
        r.data[source].edges = r.data[source].edges.filter(function (_ref7) {
          var node = _ref7.node;
          return !exclude.some(function (excludedRoute) {
            var slug = source === "allMarkdownRemark" ? node.fields.slug.replace(/^\/|\/$/, "") : node.slug.replace(/^\/|\/$/, "");
            excludedRoute = excludedRoute.replace(/^\/|\/$/, "");
            return slug.indexOf(excludedRoute) >= 0;
          });
        });
      }
    };

    for (var source in r.data) {
      _loop(source);
    }

    return r.data;
  });
};

var serialize = function serialize(_temp, _ref8, mapping, pathPrefix) {
  var _ref9 = _temp === void 0 ? {} : _temp,
      sources = (0, _extends2.default)({}, _ref9);

  var site = _ref8.site,
      allSitePage = _ref8.allSitePage;
  var nodes = [];
  var sourceObject = {};
  siteUrl = site.siteMetadata.siteUrl;

  var _loop2 = function _loop2(source) {
    if (mapping[source] && mapping[source].source) {
      var currentSource = sources.hasOwnProperty(source) ? sources[source] : [];

      if (currentSource) {
        sourceObject[mapping[source].source] = sourceObject[mapping[source].source] || [];
        currentSource.edges.map(function (_ref10) {
          var node = _ref10.node;

          if (!node) {
            return;
          }

          if (source === "allMarkdownRemark") {
            node = serializeMarkdownNodes(node);
          } // get the real path for the node, which is generated by Gatsby


          node = getNodePath(node, allSitePage, pathPrefix, mapping[source].path);
          sourceObject[mapping[source].source].push({
            url: _url.default.resolve(siteUrl, node.path),
            node: node
          });
        });
      }
    }
  };

  for (var source in sources) {
    _loop2(source);
  }

  nodes.push(sourceObject);
  var pageNodes = addPageNodes(nodes, allSitePage.edges, siteUrl);

  var allNodes = _lodash.default.merge(nodes, pageNodes);

  return allNodes;
};

var onPostBuild =
/*#__PURE__*/
function () {
  var _ref12 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee3(_ref11, pluginOptions) {
    var graphql, pathPrefix, queryRecords, options, mapping, indexSitemapFile, resourcesSitemapFile, defaultQueryRecords, manager, resourcesSiteMapsArray, indexSiteMap;
    return _regenerator.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            graphql = _ref11.graphql, pathPrefix = _ref11.pathPrefix;
            options = Object.assign(_defaults.default, options, pluginOptions);
            mapping = options.mapping;
            indexSitemapFile = _path.default.join(PUBLICPATH, INDEXFILE);
            resourcesSitemapFile = _path.default.join(PUBLICPATH, RESOURCESFILE);
            delete options.plugins;
            delete options.createLinkInHead;
            options.indexOutput = INDEXFILE;
            options.resourcesOutput = RESOURCESFILE; // We always query siteAllPage as well as the site query to
            // get data we need and to also allow not passing any custom
            // query or mapping

            _context3.next = 11;
            return runQuery(graphql, {
              query: DEFAULTQUERY,
              exclude: options.exclude
            });

          case 11:
            defaultQueryRecords = _context3.sent;

            if (!(!options.query || !options.mapping)) {
              _context3.next = 16;
              break;
            }

            options.mapping = options.mapping || DEFAULTMAPPING;
            _context3.next = 19;
            break;

          case 16:
            _context3.next = 18;
            return runQuery(graphql, options);

          case 18:
            queryRecords = _context3.sent;

          case 19:
            // Instanciate the Ghost Sitemaps Manager
            manager = new _SiteMapManager.default(options);
            serialize(queryRecords, defaultQueryRecords, mapping, pathPrefix).forEach(function (source) {
              var _loop3 = function _loop3(type) {
                source[type].forEach(function (node) {
                  // "feed" the sitemaps manager with our serialized records
                  manager.addUrls(type, node);
                });
              };

              for (var type in source) {
                _loop3(type);
              }
            }); // The siteUrl is only available after we have the returned query results

            options.siteUrl = siteUrl;
            _context3.next = 24;
            return copyStylesheet(options);

          case 24:
            resourcesSiteMapsArray = []; // Because it's possible to map duplicate names and/or sources to different
            // sources, we need to serialize it in a way that we know which source names
            // we need and which types they are assignes to, independently from where they
            // come from

            options.sources = serializeSources(mapping);
            options.sources.forEach(function (type) {
              // for each passed name we want to receive the related source type
              resourcesSiteMapsArray.push({
                type: type.name,
                xml: manager.getSiteMapXml(type.source, options)
              });
            });
            indexSiteMap = manager.getIndexXml(options); // Save the generated xml files in the public folder

            _context3.prev = 28;
            _context3.next = 31;
            return _fsExtra.default.writeFile(indexSitemapFile, indexSiteMap);

          case 31:
            resourcesSiteMapsArray.forEach(
            /*#__PURE__*/
            function () {
              var _ref13 = (0, _asyncToGenerator2.default)(
              /*#__PURE__*/
              _regenerator.default.mark(function _callee2(sitemap) {
                var filePath;
                return _regenerator.default.wrap(function _callee2$(_context2) {
                  while (1) {
                    switch (_context2.prev = _context2.next) {
                      case 0:
                        filePath = resourcesSitemapFile.replace(/:resource/, sitemap.type);
                        _context2.next = 3;
                        return _fsExtra.default.writeFile(filePath, sitemap.xml);

                      case 3:
                      case "end":
                        return _context2.stop();
                    }
                  }
                }, _callee2);
              }));

              return function (_x4) {
                return _ref13.apply(this, arguments);
              };
            }());
            _context3.next = 37;
            break;

          case 34:
            _context3.prev = 34;
            _context3.t0 = _context3["catch"](28);
            console.error(_context3.t0);

          case 37:
            return _context3.abrupt("return");

          case 38:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, null, [[28, 34]]);
  }));

  return function onPostBuild(_x2, _x3) {
    return _ref12.apply(this, arguments);
  };
}();

exports.onPostBuild = onPostBuild;