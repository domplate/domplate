
const LIB = require("bash.origin.lib").forPackage(__dirname).js;

const PATH = LIB.path;
const FS = LIB.FS_EXTRA;
const CODEBLOCK = LIB.CODEBLOCK;
const BO = LIB.BASH_ORIGIN;


exports.forConfig = function (CONFIG) {

    // TODO: Better contextualized default '.rt' path.
    const baseDistPath = CONFIG.dist ? CONFIG.dist : PATH.join(process.cwd(), ".rt/domplate");
    // TODO: Make this 'selfSubpath' configurable based on the approach
    //       we are taking to inline dependencies into file structure.
    const selfSubpath = "";

    function augmentConfig (config, targetSubpath, opts) {
        if (baseDistPath) {
            if (opts) {
                if (opts.dist === false) {
                    config.dist = false;
                } else {
                    config.dist = PATH.join(baseDistPath, selfSubpath, (typeof opts.dist === 'boolean' || !opts.dist) ? '' : opts.dist, targetSubpath);
                }
            } else
            if (CONFIG.distDomplate !== false) {
                config.dist = PATH.join(baseDistPath, selfSubpath, targetSubpath);
            }
        }
        if (CONFIG.compile === true) {
            config.prime = true;
        } else
        if (typeof CONFIG.prime !== "undefined") {
            config.prime = CONFIG.prime;
        }
        return config;
    }

    function compileIfDesired (code, structs, callback) {
        if (CONFIG.compile !== true) {
            return callback(null, null);
        }
        try {
            new LIB.JSDOM.JSDOM(`
                <head>
                    <script src="file://${baseDistPath}/domplate-eval.browser.js"></script>
                </head>
                <body>
                <div></div>
                <script>
                    window.domplate.ensureLoader();
                    function init () {
                        var PINF = {
                            bundle: function (id, modules) {
                                window.PINF.sandbox(modules, function (sandbox) {
                                    var rep = sandbox.main(window.domplate);
                                    window.ready(rep);
                                });
                            }
                        };
                        ${code}
                    }
                    init();
                </script>
                </body>
            `, {
                runScripts: "dangerously",
                resources: "usable",
                beforeParse: function (window) {

                    window.ready = function (rep) {

                        var el = window.document.querySelector("DIV");

                        var tagInfo = {};
                        
                        Object.keys(rep).forEach(function (name) {

                            if (!rep[name].tag) return;

                            var info = {
                                markup: null,
                                dom: null,
                                preview: null
                            }

                            window.domplate.EVAL.onMarkupCode = function (code) {
                                info.markup = code;
                            };

                            window.domplate.EVAL.onDOMCode = function (code) {
                                info.dom = code;
                            };

                            var injectStruct = CONFIG.injectStruct || {};
                            if (typeof injectStruct === "function") {
                                injectStruct = injectStruct(window);
                            }

                            try {
                                rep[name].replace(LIB.LODASH.merge({}, structs[name] || structs["tag"] || {}, injectStruct), el);
                            } catch (err) {

                                if (err.stack) {
                                    var stackFrame = err.stack.split("\n")[1];
                                    if (/at Object\.eval \(/.test(stackFrame)) {

                                        if (/exports\.compileMarkup/.test(stackFrame)) {

                                            console.error("info.markup\n\n", info.markup, "\n");

                                            console.error("DOMPLATE compileMarkup EVAL ERROR", err);

                                        } else
                                        if (/exports\.compileDOM/.test(stackFrame)) {

                                            console.error("info.dom\n\n", info.dom, "\n");

                                            console.error("DOMPLATE compileDOM EVAL ERROR", err);

                                        } else {
                                            throw err;
                                        }
                                    } else {
                                        throw err;
                                    }
                                } else {
                                    throw err;
                                }
                            }

                            info.preview = el.innerHTML;

                            tagInfo[name] = info;
                        });

                        return callback(null, tagInfo);
                    }                        
                }
            });
        } catch (err) {
            return callback(err);
        }
    }

    const repRoutes = {
        "/domplate.browser.js": {
            "@it.pinf.org.browserify#s1": augmentConfig({
                "src": PATH.join(__dirname, "lib/domplate.js"),
                "format": "browser",
                "expose": {
                    "window": "domplate"
                },
                "strictMode": false
            }, "domplate.browser.js")
        },
        "/domplate-eval.browser.js": {
            "@it.pinf.org.browserify#s1": augmentConfig({
                "src": PATH.join(__dirname, "lib/domplate-eval.js"),
                "format": "browser",
                "expose": {
                    "window": "domplate"
                },
                "strictMode": false
            }, "domplate-eval.browser.js")
        }
    };
    Object.keys(CONFIG.reps).forEach(function (uri) {

        function getBundleCode (callback) {
            try {
                var repCode = CONFIG.reps[uri];

                var dist = null;
                if (typeof repCode.dist !== "undefined") {
                    dist = repCode.dist;
                }

                var structs = repCode.structs || null;
                if (!structs && repCode.struct) {
                    structs = {
                        tag: repCode.struct
                    };
                }

                if (structs && repCode.rep) {
                    repCode = repCode.rep;
                }

                var cssCode = null;
                var rawCssCode = null;
                var repBuildId = null;

                var repCodeSrcPath = false;
                if (/^\//.test(repCode)) {
                    repCodeSrcPath = repCode;

                    function loadRepAtPath (repCodeSrcPath) {
                        var repCode = FS.readFileSync(repCodeSrcPath, "utf8");

                        if (/(^|\n)PINF\.bundle\(/.test(repCode)) {
                            // Already bundled
                            return callback(null, repCode);
                        }

                        repCode = repCode.replace(/^module.exports = \{/, "{");

                        repBuildId = repBuildId || LIB.CRYPTO.createHash('sha1').update(repCode).digest('hex');

                        repCode = CODEBLOCK.purifyCode(repCode, {
                            freezeToJavaScript: true,
                            on: {
                                codeblock: function (codeblock) {
    
                                    if (codeblock.getFormat() === "css") {

                                        var css = codeblock.getCode();

                                        css = css.replace(/:scope\s*/g, '');

                                        rawCssCode = css;

                                        codeblock._format = "text";
                                        codeblock.setCode(css);
                                    }

                                    return codeblock;
                                }
                            }
                        });
                        
                        eval('repCode = ' + repCode.toString());

                        if (
                            repCode.css &&
                            repCode.css[".@"] === "github.com~0ink~codeblock/codeblock:Codeblock"
                        ) {
                            repCode.css = CODEBLOCK.thawFromJSON(repCode.css).getCode();
                        }
                        if (repCode.rep) {
                            repCode.rep = repCode.rep.toString().replace(/^function \(\) \{\n([\s\S]+)\n\s*\}$/, "$1");
                        }

                        if (!repCode.structs && repCode.struct) {
                            repCode.structs = {
                                tag: repCode.struct
                            };
                            delete repCode.struct;
                        }
        
                        // Check if the rep is inheriting from another rep.
                        if (
                            typeof repCode.rep === "string" &&
                            /^\.\.?\//.test(repCode.rep)
                        ) {
                            var masterRepCode = loadRepAtPath(LIB.PATH.join(repCodeSrcPath, "..", repCode.rep.replace(/(\.js)?$/, ".js")));

                            if (masterRepCode.structs) {
                                repCode.structs = LIB.LODASH.merge(masterRepCode.structs, repCode.structs || {});
                            }

                            if (masterRepCode.css) {
                                repCode.css = masterRepCode.css + "\n" + (repCode.css || "");
                            }

                            repCode.rep = masterRepCode.rep;
                        }

                        return repCode;
                    }

                    repCode = loadRepAtPath(repCodeSrcPath);

                    if (typeof repCode.dist !== "undefined") {
                        dist = repCode.dist || null;
                    }
                    structs = repCode.structs || null;
                    if (structs && repCode.rep) {
                        cssCode = repCode.css || null;
                        repCode = repCode.rep;
                    }
                    
                } else
                if (repCode[".@"] === "github.com~0ink~codeblock/codeblock:Codeblock") {
                    repCode = CODEBLOCK.thawFromJSON(repCode).getCode();
                } else
                if (typeof repCode === "function") {
                    repCode = repCode.toString().replace(/^function[^\()]*\(\) \{\n([\s\S]+)\n\s*\}$/, "$1");
                } else {
                    throw new Error("Unknown code format!");
                }

                repBuildId = repBuildId || LIB.CRYPTO.createHash('sha1').update(repCode).digest('hex');

                // TODO: Optionally use canonical namespace or hash.
                var repTagId = PATH.join(CONFIG.repIdPrefix || '', selfSubpath, (typeof dist === "boolean" || !dist) ? '' : dist, uri);


                if (cssCode) {
                    const POSTCSS = require("postcss");
                    cssCode = POSTCSS([
                        POSTCSS.plugin('scope-selectors-plugin', function (opts) {
                            opts = opts || {};

                            // Work with options here
                            return function (root, result) {

                                root.walkRules(function(rule) {
                                    // We'll put more code here in a moment…
                                    rule.selector = rule.selector.replace(/[\n\s\t]+/g, ' ').replace(/(^\s|\s$)/g, '');

                                    var selectors = rule.selector.split(',');
                                    selectors = selectors.map(function (selector) {
                                        return selector.replace(/^([A-Za-z0-9_\-\.]+)(\[.+\])?(:.+)?(\s.+)?$/, '$1[__dbid="' + repBuildId + '"]$2$3$4');
                                    });
                                    rule.selector = selectors.join(',');
                                });                                                    
                                // Transform CSS AST here
                            };
                        })
                    ]).process(cssCode).css;
                }


                // Wrap rep
                repCode = [
                    'function impl (domplate) {',
                        repCode,
                    '}',
                    ((function () {
                        if (CONFIG.externalizeCss) {
                            return '';
                        } else {
                            return [
                                'function css () {',
                                'return atob("' + (Buffer.from(cssCode || "").toString('base64')) + '")',
                            '}',
                        ].join("\n");
                        }
                    })()),
                    'exports.main = function (domplate, options) {',
                        'options = options || {};',
                        'var rep = impl(domplate);',
                        'rep.__dom = "%%DOM%%";',
                        'rep.__markup = "%%MARKUP%%";',
                        // '__dbid' - Domplate Build ID
                        'rep.__dbid = "' + repBuildId + '";',
                        // '__dtid' - Domplate Tag ID
                        'rep.__dtid = "' + repTagId + '";',
                        'var res = domplate.domplate(rep);',

                        // TODO: Do this in a better way.
                        'var injectedCss = false;',
                        'rep.__ensureCssInjected = function () {',
                            'if (injectedCss) return;',
                            'injectedCss = true;',
                            // TODO: Buffer all CSS into the same stylesheet
                            //       IE9 only supports 32 stylesheets which was increased to 4095 in IE 10.
                            ((function () {
                                if (CONFIG.externalizeCss) {

                                    const distSub = (typeof dist === "boolean" || !dist) ? '' : dist;
                                    const cssUri = LIB.PATH.join(uri + '.rep.css');
                                    const cssPath = LIB.PATH.join(baseDistPath, selfSubpath, distSub, cssUri);

                                    FS.outputFileSync(cssPath, cssCode, 'utf8');

                                    return [
                                        'domplate.loadStyle("' + cssUri + '", options.cssBaseUrl || undefined);',
                                    ].join("\n");

                                } else {
                                    return [
                                        'var node = document.createElement("style");',
                                        'var cssCode = css();',
                                        'if (cssCode) {',
                                            'if (options.cssBaseUrl) {',
                                                'cssCode = cssCode.replace(/(url\\s*\\()([^\\)]+\\))/g, "$1" + options.cssBaseUrl + "$2");',
                                            '}',
                                            'node.innerHTML = cssCode;',
                                            'document.body.appendChild(node);',
                                        '}'
                                    ].join("\n");
                                }
                            })()),
                        '};',

                        'Object.keys(rep).forEach(function (tagName) {',
                            'if (!rep[tagName].tag) return;',
                            'var replace_orig = res[tagName].replace;',
                            'res[tagName].replace = function () {',
                                'var res = replace_orig.apply(this, arguments);',
                                'if (!res) return;',
                                'setTimeout(function () {',
                                    'rep.__ensureCssInjected();',
                                '}, 0);',
                                'return res;',
                            '}',
                        '});',
                        'return res;',
                    '}'
                ].join("\n");

                // Browserify code.
                var implConfig = {
                    format: "pinf"
                };
                if (repCodeSrcPath) {
                    //FS.outputFileSync(repCodeSrcPath + "~.compiled.js", repCode, "utf8");
                    implConfig.code = repCode;//repCodeSrcPath + "~.compiled.js";
                    implConfig.basedir = PATH.dirname(repCodeSrcPath);
                } else {
                    implConfig.code = repCode;
                }

                var opts = {};
                if (dist !== null) {
                    opts.dist = dist;
                }
                implConfig = augmentConfig(implConfig, uri + ".rep.js", opts);

                var implMod = BO.depend("it.pinf.org.browserify#s1", implConfig);
                implMod["#io.pinf/process~s1"]({}, function (err, repCode) {
                    if (err) return callback(err);

                    var domCode = {};
                    var markupCode = {};
                    if (structs) {
                        Object.keys(structs).forEach(function (name) {
                            domCode[name] = null;
                            markupCode[name] = null;
                        });
                    }

                    var repSource = repCode;
                    repSource = repSource.replace(/["']use strict['"];/g, "");
                    repSource = repSource.replace(/"%%DOM%%"/, JSON.stringify(domCode));
                    repSource = repSource.replace(/"%%MARKUP%%"/, JSON.stringify(markupCode));     

                    compileIfDesired(repSource, structs, function (err, result) {
                        if (err) return callback(err);

                        var repBuild = repCode;
                        if (result) {

                            var domCode = ['{'];
                            var markupCode = ['{'];
                            Object.keys(result).forEach(function (name, i) {
                                if (i > 0) {
                                    domCode.push(",");
                                    markupCode.push(",");
                                }
                                domCode.push('"' + name + '":' + [
                                    'function (context) {',
                                        'var DomplateDebug = context.DomplateDebug;',
                                        'var __path__ = context.__path__;',
                                        'var __bind__ = context.__bind__;',
                                        'var __if__ = context.__if__;',
                                        'var __link__ = context.__link__;',
                                        'var __loop__ = context.__loop__;',
                                        'return ' + result[name].dom,
                                    '}'
                                ].join("\n"));
                                markupCode.push('"' + name + '":' + [
                                    'function (context) {',
                                        'var DomplateDebug = context.DomplateDebug;',
                                        'var __escape__ = context.__escape__;',
                                        'var __if__ = context.__if__;',
                                        'var __loop__ = context.__loop__;',
                                        'var __link__ = context.__link__;',
                                        'return ' + result[name].markup,
                                    '}'
                                ].join("\n"));
                            });
                            domCode.push('}');
                            markupCode.push('}');

                            repBuild = repBuild.replace(/["']use strict['"];/g, "");
                            repBuild = repBuild.replace(/"%%DOM%%"/, domCode.join("\n"));
                            repBuild = repBuild.replace(/"%%MARKUP%%"/, markupCode.join("\n"));

                            if (dist !== false) {

                                var distSub = (typeof dist === "boolean" || !dist) ? '' : dist;

                                // Already written by 'BO.depend("it.pinf.org.browserify#s1", implConfig);'
                                // but we write again as we changed the code.
                                FS.outputFileSync(PATH.join(baseDistPath, selfSubpath, distSub, uri + ".rep.js"), repBuild, "utf8");

                                FS.outputFileSync(PATH.join(baseDistPath, selfSubpath, distSub, uri + ".preview.htm"), [
                                    '<html>',
                                    '<body>',
                                    Object.keys(result).map(function (name) {
                                        return [
                                            '',
                                            '<h2>' + name + '</h2>',
                                            '',
                                            result[name].preview,
                                            '',
                                            ''
                                        ].join("\n");
                                    }).join("<br/>\n"),
                                    '</body>',
                                    '</html>'
                                ].join("\n"), "utf8");

                                // Scan for URLs in css and copy relevant files
                                // TODO: Use PostCSS for this
                                var filepaths = [];
                                if (rawCssCode) {
                                    var re = /url\s*\(([^\)]+)\)[^;]*;?/g;
                                    var match = null;
                                    while ( match = re.exec(rawCssCode) ) {
                                        filepaths.push(match[1]);
                                    }
                                }
                                filepaths.forEach(function (filepath) {
                                    var sourcePath = PATH.join(implConfig.basedir, filepath);
                                    if (!FS.existsSync(sourcePath)) {
                                        throw new Error("File '" + sourcePath + "' referenced in CSS not found at '" + sourcePath + "'!");
                                    }
                                    FS.copySync(sourcePath, PATH.join(baseDistPath, selfSubpath, distSub, uri, '..', filepath));
                                });
                            }
                        } else {
                            repBuild = repSource;
                        }

                        return callback(null, repBuild);
                    });
                });

            } catch (err) {
                return callback(err);
            }
        }

        if (
            baseDistPath &&
            CONFIG.prime
        ) {
            if (process.env.VERBOSE) console.log("[domplate] Prime ...");

            getBundleCode(function (err, bundleCode) {
                if (err) return console.error(err);

                FS.outputFileSync(PATH.join(baseDistPath, selfSubpath, uri + ".rep.js"), bundleCode, "utf8");
            });
        }

        repRoutes["/" + uri + ".rep.js"] = function () {
            
            return function (req, res, next) {
                res.writeHead(200, {
                    "Content-Type": "application/javascript"
                });
                getBundleCode(function (err, bundleCode) {
                    if (err) return next(err);

                    res.end(bundleCode);                    
                });
            };
        };
    });

    FS.ensureDirSync(baseDistPath);
    repRoutes["^\\/"] = baseDistPath;

    const repsApp = LIB.BASH_ORIGIN_EXPRESS.hookRoutes(repRoutes);

    return {
        "#io.pinf/middleware~s1": function (API) {

            var m = null;

            return function (req, res, next) {

                // TODO: Use standard route conventions for these.
                if (req.method === "GET") {
                    if (
                        req.url === "/domplate.browser.js" ||
                        req.url === "/domplate-eval.browser.js"
                    ) {
                        repsApp(req, res, next);
                        return;
                    } else
                    if ((m = req.url.match(/^\/(.+)\.rep\.js$/))) {
                        if (CONFIG.reps[m[1]]) {
                            repsApp(req, res, next);
                            return;
                        } else {
                            return next(new Error("Rep with name '" + m[1] + "' not declared!"));
                        }
                    } else {
                        repsApp(req, res, next);
                        return;
                    }
                }
//                return next();
            };
        }
    }
}
