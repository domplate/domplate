
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

    function compileIfDesired (code, callback) {
        if (CONFIG.compile !== true) {
            return callback(null, code);
        }
        try {
            const dom = new LIB.JSDOM.JSDOM(`
                <head>
                    <script src="file://${baseDistPath}/domplate.js"></script>
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
                                    rep.tag.replace({
                                        message: "Hello World"
                                    }, document.querySelector("DIV"));

console.error(document.querySelector("DIV").innerHTML);
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
                resources: "usable"
            });

//console.log("TEST CONTENT:", dom.window.domplate);

// TODO: wait for the complication    
            
            return callback(null, code);

    //        throw new Error("STOP");
            return code;
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
        }
    };
    Object.keys(CONFIG.reps).forEach(function (uri) {

        function getBundleCode (callback) {
            try {
                var repCode = CONFIG.reps[uri];
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
                        'return domplate.domplate(impl(domplate));',
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

                    compileIfDesired(repCode, function (err, repCode) {
                        if (err) return callback(err);

                        return callback(null, repCode);
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
