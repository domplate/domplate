
const LIB = require("bash.origin.workspace").forPackage(__dirname).LIB;

const PATH = LIB.PATH;
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
            } else {
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

    function compileIfDesired (code, struct, callback) {
        if (CONFIG.compile !== true) {
            return callback(null, null);
        }
        try {
            new LIB.JSDOM.JSDOM(`
                <head>
                    <script src="file://${baseDistPath}/domplate-eval.js"></script>
                </head>
                <body>
                <div></div>
                <script>
                    window.domplate.ensureLoader();
                    function init () {
                        var PINF = {
                            bundle: function (id, modules) {
                                window.PINF.sandbox(modules, function (sandbox) {
                                    var rep = sandbox.main();                                    

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
                            
                        rep.tag.replace(struct, el);

                        info.preview = el.innerHTML;

                        return callback(null, info);
                    }                        
                }
            });
        } catch (err) {
            return callback(err);
        }
    }

    const repRoutes = {
        "/domplate.js": {
            "@it.pinf.org.browserify#s1": augmentConfig({
                "src": PATH.join(__dirname, "lib/domplate.js"),
                "format": "browser",
                "expose": {
                    "window": "domplate"
                }
            }, "domplate.js")
        },
        "/domplate-eval.js": {
            "@it.pinf.org.browserify#s1": augmentConfig({
                "src": PATH.join(__dirname, "lib/domplate-eval.js"),
                "format": "browser",
                "expose": {
                    "window": "domplate"
                }
            }, "domplate-eval.js")
        }
    };
    Object.keys(CONFIG.reps).forEach(function (uri) {

        function getBundleCode (callback) {
            try {
                var repCode = CONFIG.reps[uri];

                var dist = repCode.dist || false;

                var struct = repCode.struct || null;
                if (struct && repCode.rep) {
                    repCode = repCode.rep;
                }

                var cssCode = null;
                var rawCssCode = null;
                var repBuildId = null;

                var repCodeSrcPath = false;
                if (/^\//.test(repCode)) {
                    repCodeSrcPath = repCode;
                    repCode = FS.readFileSync(repCodeSrcPath, "utf8");

                    if (/(^|\n)PINF\.bundle\(/.test(repCode)) {
                        // Already bundled
                        return callback(null, repCode);
                    }

                    repCode = repCode.replace(/^module.exports = \{/, "{");
                    
                    var repBuildId = LIB.CRYPTO.createHash('sha1').update(repCode).digest('hex');
                    
                    repCode = CODEBLOCK.purifyCode(repCode, {
                        freezeToJavaScript: true,
                        on: {
                            codeblock: function (codeblock) {

                                if (codeblock.getFormat() === "css") {

                                    var css = codeblock.getCode();

                                    css = css.replace(/:scope/g, '[_dbid="' + repBuildId + '"]');

                                    rawCssCode = css;

                                    codeblock._format = "javascript";
                                    codeblock.setCode([
                                        'function () {',
                                            'return atob("' + (new Buffer(css).toString('base64')) + '")',
                                        '}'
                                    ].join("\n"));
                                }

                                return codeblock;
                            }
                        }
                    });
                    
                    eval('repCode = ' + repCode.toString());

                    dist = repCode.dist || null;
                    struct = repCode.struct || null;
                    if (struct && repCode.rep) {
                        cssCode = repCode.css || null;
                        repCode = repCode.rep;
                    }

                    if (cssCode) {
                        cssCode = cssCode.toString().replace(/^function \(\) \{\n([\s\S]+)\n\s*\}$/, "$1");
                    }
                    repCode = repCode.toString().replace(/^function \(\) \{\n([\s\S]+)\n\s*\}$/, "$1");
                    
                } else
                if (repCode[".@"] === "github.com~0ink~codeblock/codeblock:Codeblock") {
                    repCode = CODEBLOCK.thawFromJSON(repCode).getCode();
                } else
                if (typeof repCode === "function") {                    
                    repCode = repCode.toString().replace(/^function \(\) \{\n([\s\S]+)\n\s*\}$/, "$1");
                } else {
                    throw new Error("Unknown code format!");
                }

                repBuildId = repBuildId || LIB.CRYPTO.createHash('sha1').update(repCode).digest('hex');

                // Wrap rep
                repCode = [
                    'function impl (domplate) {',
                    repCode,
                    '}',
                    'function css () {',
                    cssCode,
                    '}',
                    'exports.main = function (options) {',
                        'options = options || {};',
                        'var domplate = window.domplate;',
                        'var rep = impl(domplate);',
                        'rep.tag__dom = "%%DOM%%";',
                        'rep.tag__markup = "%%MARKUP%%";',
                        'var res = domplate.domplate(rep);',
                        // TODO: Do this in a better way.
                        'var replace_orig = res.tag.replace;',
                        'res.tag.replace = function () {',
                            'var res = replace_orig.apply(this, arguments);',
                            // '_dbid' - Domplate Build ID
                            'res.parentNode.setAttribute("_dbid", "' + repBuildId + '");',
                            // TODO: Buffer all CSS into the same stylesheet
                            //       IE9 only supports 32 stylesheets which was increased to 4095 in IE 10.
                            'var node = document.createElement("style");',
                            'var cssCode = css();',
                            'if (options.cssBaseUrl) {',
                                'cssCode = cssCode.replace(/(url\\s*\\()([^\\)]+\\))/g, "$1" + options.cssBaseUrl + "$2");',
                            '}',
                            'node.innerHTML = cssCode;',
                            'document.body.appendChild(node);',
                            'return res;',
                        '}',
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
                opts.dist = dist;
                implConfig = augmentConfig(implConfig, uri + ".rep.js", opts);

                var implMod = BO.depend("it.pinf.org.browserify#s1", implConfig);
                implMod["#io.pinf/process~s1"]({}, function (err, repCode) {
                    if (err) return callback(err);

                    var repSource = repCode;
                    repSource = repSource.replace(/["']use strict['"];/g, "");
                    repSource = repSource.replace(/"%%DOM%%"/, "null");
                    repSource = repSource.replace(/"%%MARKUP%%"/, "null");     

                    compileIfDesired(repSource, struct, function (err, result) {
                        if (err) return callback(err);

                        var repBuild = repCode;
                        if (result) {
                            repBuild = repBuild.replace(/["']use strict['"];/g, "");
                            repBuild = repBuild.replace(/"%%DOM%%"/, [
                                'function (context) {',
                                    'var DomplateDebug = context.DomplateDebug;',
                                    'var __path__ = context.__path__;',
                                    'var __bind__ = context.__bind__;',
                                    'var __if__ = context.__if__;',
                                    'var __link__ = context.__link__;',
                                    'var __loop__ = context.__loop__;',
                                    'return ' + result.dom,
                                '}'
                            ].join("\n"));
                            repBuild = repBuild.replace(/"%%MARKUP%%"/, [
                                'function (context) {',
                                    'var DomplateDebug = context.DomplateDebug;',
                                    'var __escape__ = context.__escape__;',
                                    'var __if__ = context.__if__;',
                                    'var __loop__ = context.__loop__;',
                                    'var __link__ = context.__link__;',
                                    'return ' + result.markup,
                                '}'
                            ].join("\n"));

                            if (dist !== false) {

                                var distSub = (typeof dist === "boolean" || !dist) ? '' : dist;

                                // Should already be written by 'BO.depend("it.pinf.org.browserify#s1", implConfig);'
                                //FS.outputFileSync(PATH.join(baseDistPath, selfSubpath, distSub, uri + ".rep.js"), repBuild, "utf8");

                                FS.outputFileSync(PATH.join(baseDistPath, selfSubpath, distSub, uri + ".preview.htm"), [
                                    '<html>',
                                    '<body>',
                                    '',
                                    result.preview,
                                    '',
                                    '</body>',
                                    '</html>'
                                ].join("\n"), "utf8");

                                // Scan for URLs in css and copy relevant files
                                // TODO: Use PostCSS for this
                                var filepaths = [];
                                var re = /url\s*\(([^\)]+)\);/g;
                                var match = null;
                                while ( match = re.exec(rawCssCode) ) {
                                    filepaths.push(match[1]);
                                }
                                filepaths.forEach(function (filepath) {
                                    var sourcePath = PATH.join(implConfig.basedir, filepath);
                                    if (!FS.existsSync(sourcePath)) {
                                        throw new Error("File '" + sourcePath + "' referenced in CSS not found at '" + sourcePath + "'!");
                                    }
                                    FS.copySync(sourcePath, PATH.join(baseDistPath, selfSubpath, distSub, uri, '..', filepath));
                                });
                            }
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

    if (!LIB.FS.existsSync(baseDistPath)) {
        LIB.FS.mkdirSync(baseDistPath);
    }
    repRoutes["^\\/"] = baseDistPath;

    const repsApp = LIB.BASH_ORIGIN_EXPRESS.hookRoutes(repRoutes);

    return {
        "#io.pinf/middleware~s1": function (API) {

            var m = null;

            return function (req, res, next) {

                // TODO: Use standard route conventions for these.
                if (req.method === "GET") {
                    if (
                        req.url === "/domplate.js" ||
                        req.url === "/domplate-eval.js"
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
