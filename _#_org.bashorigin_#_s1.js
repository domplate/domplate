
const LIB = require("bash.origin.workspace").forPackage(__dirname).LIB;

const PATH = LIB.PATH;
const FS = LIB.FS_EXTRA;
const CODEBLOCK = LIB.CODEBLOCK;
const BO = LIB.BASH_ORIGIN;


exports.forConfig = function (CONFIG) {

    // TODO: Better contextualized default '.rt' path.
    const baseDistPath = CONFIG.dist ? CONFIG.dist.replace(/\.([^\.]+)$/, "") : PATH.join(process.cwd(), ".rt/domplate");
    // TODO: Make this 'selfSubpath' configurable based on the approach
    //       we are taking to inline dependencies into file structure.
    const selfSubpath = "";

    function augmentConfig (config, targetSubpath) {
        if (baseDistPath) {
            config.dist = PATH.join(baseDistPath, selfSubpath, targetSubpath);
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
                "format": "standalone",
                "expose": {
                    "window": "domplate"
                }
            }, "domplate.js")
        },
        "/domplate-eval.js": {
            "@it.pinf.org.browserify#s1": augmentConfig({
                "src": PATH.join(__dirname, "lib/domplate-eval.js"),
                "format": "standalone",
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

                var struct = repCode.struct || null;
                if (struct && repCode.rep) {
                    repCode = repCode.rep;
                }

                var repCodeSrcPath = false;
                if (/^\//.test(repCode)) {
                    repCodeSrcPath = repCode;
                    repCode = FS.readFileSync(repCodeSrcPath, "utf8");

                    if (/(^|\n)PINF\.bundle\(/.test(repCode)) {
                        // Already bundled
                        return callback(null, repCode);
                    }

                    repCode = CODEBLOCK.purifyCode(repCode, {
                        freezeToJavaScript: true,
                        on: {
                            codeblock: function (codeblock) {
                                throw new Error("Codeblock format '" + codeblock.getFormat() + "' not yet supported!");
                            }
                        }
                    });

                } else
                if (repCode[".@"] === "github.com~0ink~codeblock/codeblock:Codeblock") {
                    repCode = CODEBLOCK.thawFromJSON(repCode).getCode();
                } else
                if (typeof repCode === "function") {                    
                    repCode = repCode.toString().replace(/^function \(\) \{\n([\s\S]+)\n\s*\}$/, "$1");
                } else {
                    throw new Error("Unknown code format!");
                }

                // Wrap rep
                repCode = [
                    'function impl (domplate) {',
                    repCode,
                    '}',
                    'exports.main = function () {',
                        'var domplate = window.domplate;',
                        'var rep = impl(domplate);',
                        'rep.tag__dom = "%%DOM%%";',
                        'rep.tag__markup = "%%MARKUP%%";',
                        'return domplate.domplate(rep);',
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

                implConfig = augmentConfig(implConfig, uri + ".rep.js")

                var implMod = BO.depend("it.pinf.org.browserify#s1", implConfig);
                implMod["#io.pinf/process~s1"]({}, function (err, repCode) {
                    if (err) return callback(err);

                    var repSource = repCode;
                    repSource = repSource.replace(/"use strict";/g, "");
                    repSource = repSource.replace(/"%%DOM%%"/, "null");
                    repSource = repSource.replace(/"%%MARKUP%%"/, "null");                    

                    compileIfDesired(repSource, struct, function (err, result) {
                        if (err) return callback(err);

                        var repBuild = repCode;
                        if (result) {
                            repBuild = repBuild.replace(/"use strict";/g, "");
                            repBuild = repBuild.replace(/"%%DOM%%"/, [
                                'function () {',
                                    'return ' + result.dom,
                                '}'
                            ].join("\n"));
                            repBuild = repBuild.replace(/"%%MARKUP%%"/, [
                                'function () {',
                                    'return ' + result.markup,
                                '}'
                            ].join("\n"));

                            FS.outputFileSync(PATH.join(baseDistPath, selfSubpath, uri + ".rep.js"), repBuild, "utf8");
                            FS.outputFileSync(PATH.join(baseDistPath, selfSubpath, uri + ".preview.htm"), [
                                '<html>',
                                '<body>',
                                '',
                                result.preview,
                                '',
                                '</body>',
                                '</html>'
                            ].join("\n"), "utf8");
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

    const repsApp = LIB.BASH_ORIGIN_EXPRESS.hookRoutes(repRoutes);

    return {
        "#io.pinf/middleware~s1": function (API) {

            var m = null;

            return function (req, res, next) {

                // TODO: Use standard route conventions for these.
                if (req.method === "GET") {
                    if (req.url === "/domplate.js") {
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
                    }
                }
                return next();
            };
        }
    }
}
