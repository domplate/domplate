
const LIB = require("bash.origin.lib").js;

const PATH = LIB.path;
let FS = LIB.FS_EXTRA;
const CODEBLOCK = LIB.CODEBLOCK;
const BO = LIB.BASH_ORIGIN;

const PINF_LOADER_JS = require("pinf-loader-js");


exports.forConfig = async function (CONFIG, options) {

    if (options.LIB) {
        FS = options.LIB.FS;
        LIB.FS = FS;
        LIB.FS_EXTRA = FS;
    }

    options = options || {};

    const baseDistPath = CONFIG.dist;

    async function compileIfDesired (code, structs) {
        if (CONFIG.compile !== true) {
            return null;
        }
        if (!structs) {
            throw new Error(`'No 'structs' provided!`);
        }
        return new Promise(function (resolve, reject) {
            try {

                new LIB.JSDOM.JSDOM(`
                    <head>
                        <script src="file://${options.home.path}/dist/domplate-eval.browser.js"></script>
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

                                if (LIB.CODEBLOCK.isCodeblock(injectStruct)) {
                                    injectStruct = LIB.CODEBLOCK.thawFromJSON(injectStruct).run({
                                        window: window
                                    });
                                } else
                                if (typeof injectStruct === "function") {
                                    injectStruct = injectStruct(window);
                                }
                                
                                // injectStruct.context = injectStruct.context || {
                                //     "repForNode": function (node) {
                                    
                                //         return {
                                //             tag: null,
                                //             shortTag: null,
                                //             collapsedTag: null
                                //         };
                                //     }    
                                // }
                                
                                try {
                                    rep[name].replace(LIB.LODASH.merge({}, (structs && (structs[name] || structs["tag"])) || {}, injectStruct), el);
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

                            resolve(tagInfo);
                            return;
                        }                        
                    }
                });
            } catch (err) {
                console.error('CONFIG:', CONFIG);
                console.error('code:', code);
                return reject(err);
            }
        });
    }

    if (CONFIG.reps) {

        if (CODEBLOCK.isCodeblock(CONFIG.reps)) {

            // TODO: Use a helper from PINF.it to run this.
            CONFIG.reps = CODEBLOCK.thawFromJSON(CONFIG.reps).run({
                // TODO: Use 'invocation.pwd'
//                ___PWD___: process.cwd(),
                LIB: LIB,
                process: process,
                result: options.result,
                build: options.build,
                target: options.target,
                instance: options.instance,
                home: options.home,
                workspace: options.workspace
//                invocation: options.invocation || null
            });
        }

        await LIB.BLUEBIRD.map(Object.keys(CONFIG.reps), async function (uri) {

            var repCode = CONFIG.reps[uri];

//             var dist = null;
//             if (typeof repCode.dist !== "undefined") {
// //                dist = repCode.dist;
//             }

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

            if (/^\.{1,2}\//.test(repCode)) {
                repCode = PATH.join(options.build.path, repCode);
            }

            if (/^\//.test(repCode)) {
                repCodeSrcPath = repCode;

                function loadRepAtPath (repCodeSrcPath) {

                    options.result.inputPaths[repCodeSrcPath] = true;
//                            options.emitUsedPath(repCodeSrcPath);

                    var repCode = FS.readFileSync(repCodeSrcPath, "utf8");

                    if (/(^|\n)PINF\.bundle\(/.test(repCode)) {
                        // Already bundled
                        return repCode;
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
                    
//console.log('>>>', repCode.toString(), '<<<');

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
                    } else
                    if (repCode.extend) {

                        var masterRepCode = loadRepAtPath(LIB.PATH.join(repCodeSrcPath, "..", repCode.extend.replace(/(\.js)?$/, ".js")));

                        if (masterRepCode.structs) {
                            repCode.structs = LIB.LODASH.merge(masterRepCode.structs, repCode.structs || {});
                        }

                        if (masterRepCode.css) {
                            repCode.css = masterRepCode.css + "\n" + (repCode.css || "");
                        }

                        repCode.rep = `
                            return ((function () {
                                const master = (function () {
                                    ${masterRepCode.rep}
                                })();
                                const sub = (function () {
                                    ${repCode.rep}
                                })();
                                Object.keys(sub).forEach(function (name) {
                                    master[name] = sub[name];
                                });
                                return master;
                            })());
                        `;
                    }

                    return repCode;
                }

                repCode = loadRepAtPath(repCodeSrcPath);

                // if (typeof repCode.dist !== "undefined") {
                //     dist = repCode.dist || null;
                // }
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

                console.error("repCode", repCode);
                
                throw new Error("Unknown code format!");
            }

            repBuildId = repBuildId || LIB.CRYPTO.createHash('sha1').update(repCode).digest('hex');

            // TODO: Optionally use canonical namespace or hash.
//            var repTagId = PATH.join(CONFIG.repIdPrefix || '', (typeof dist === "boolean" || !dist) ? '' : dist, uri);
            var repTagId = PATH.join(CONFIG.repIdPrefix || '', uri);


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
                    'rep.__dom = "%__DOM__%";',
                    'rep.__markup = "%__MARKUP__%";',
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

                                //const distSub = (typeof dist === "boolean" || !dist) ? '' : dist;
                                const cssUri = LIB.PATH.join(uri + '.rep.css');
                                const cssPath = LIB.PATH.join(baseDistPath, cssUri);
//                                const cssPath = LIB.PATH.join(baseDistPath, distSub, cssUri);

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
//                implConfig.basedir = PATH.dirname(repCodeSrcPath);
            } else {
                implConfig.code = repCode;
            }

            var opts = {};

// console.log("options.workspace.path:", options.workspace.path);
// console.log("HOME DIR:", `/${LIB.PATH.relative(options.workspace.path, options.target.path)}`.replace(/\/\//g, '/'));
// console.log("BUILD PATH:", `/${uri}.rep.js`);

            const repCodePath = await LIB['@pinf-it/core']({
                cwd: options.workspace.path
            }).runToolForModel(
                'gi0.PINF.it/build/v0',
                `/${LIB.PATH.relative(options.workspace.path, options.target.path)}`.replace(/\/\//g, '/'),
                `/${uri}.rep.js`,
                'it.pinf.org.browserify # build/v1', implConfig,
                [
                    'onBuild:path'
                ]
            );

            options.result.outputPaths[repCodePath] = true;

            // options.result.outputPaths[PATH.join(baseDistPath, uri + ".rep.js")] = true;
            // FS.outputFileSync(PATH.join(baseDistPath, uri + ".rep.js"), bundleCode, "utf8");
// console.log("repCodePath", repCodePath);

            repCode = await LIB.FS_EXTRA.readFile(repCodePath, 'utf8');


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
            repSource = repSource.replace(/"%__DOM__%"/, JSON.stringify(domCode));
            repSource = repSource.replace(/"%__MARKUP__%"/, JSON.stringify(markupCode));     


            // console.error("LOAD REP SOURCE", uri, repSource.length);
            // const compiledModule = await new Promise(function (resolve, reject) {
            //     try {
            //         const PINF = {
            //             bundle: function (id, memoizeBundle) {
            //                 const loader = new PINF_LOADER_JS.Loader();
            //                 loader.sandbox(function (require) {
            //                     memoizeBundle(require);
            //                 }, function (sandbox) {
            //                     const mod = sandbox.main();
            //                     console.error("mod", mod);
            //                     resolve(mod);
            //                 }, reject);
            //             }
            //         }
            //         eval(repSource);
            //     } catch (err) {
            //         reject(err);
            //     }
            // });
            // console.log("compiledModule", compiledModule);

            const result = await compileIfDesired (repSource, structs);


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
                repBuild = repBuild.replace(/"%__DOM__%"/, domCode.join("\n"));
                repBuild = repBuild.replace(/"%__MARKUP__%"/, markupCode.join("\n"));


//console.log("repBuild", repBuild);


                // var distSub = (typeof dist === "boolean" || !dist) ? '' : dist;

                // Already written by 'BO.depend("it.pinf.org.browserify#s1", implConfig);'
                // but we write again as we changed the code.
                // FS.outputFileSync(PATH.join(baseDistPath, distSub, uri + ".rep.js"), repBuild, "utf8");
                // options.result.outputPaths[PATH.join(baseDistPath, distSub, uri + ".rep.js")] = true;

//console.log('REP BUIULD:', PATH.join(baseDistPath, uri + ".rep.js"));

                FS.outputFileSync(PATH.join(baseDistPath, uri + ".rep.js"), repBuild, "utf8");
                options.result.outputPaths[PATH.join(baseDistPath, uri + ".rep.js")] = true;


                // options.result.outputPaths[PATH.join(baseDistPath, distSub, uri + ".preview.htm")] = true;
                // FS.outputFileSync(PATH.join(baseDistPath, distSub, uri + ".preview.htm"), [
                options.result.outputPaths[PATH.join(baseDistPath, uri + ".preview.htm")] = true;
                FS.outputFileSync(PATH.join(baseDistPath, uri + ".preview.htm"), [
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
// console.log("SCAN CSS CODE", uri, "rawCssCode", rawCssCode);
                    var re = /url\s*\(([^\)]+)\)[^;]*;?/g;
                    var match = null;
                    while ( match = re.exec(rawCssCode) ) {
                        filepaths.push(match[1]);
                    }
                }
                if (cssCode) {
// console.log("SCAN CSS CODE", uri, "cssCode", cssCode);
                    var re = /url\s*\(([^\)]+)\)[^;]*;?/g;
                    var match = null;
                    while ( match = re.exec(cssCode) ) {
                        filepaths.push(match[1]);
                    }
                }
                filepaths.forEach(function (filepath) {

                    var sourcePath = PATH.join(PATH.dirname(repCodeSrcPath), filepath);
                    if (!FS.existsSync(sourcePath)) {
                        throw new Error("File '" + sourcePath + "' referenced in CSS not found at '" + sourcePath + "'!");
                    }
//                    FS.copySync(sourcePath, PATH.join(baseDistPath, distSub, uri, '..', filepath));
                    FS.copySync(sourcePath, PATH.join(baseDistPath, uri, '..', filepath));

                    options.result.inputPaths[sourcePath] = true;
//                    options.result.outputPaths[PATH.join(baseDistPath, distSub, uri, '..', filepath)] = true;
                    options.result.outputPaths[PATH.join(baseDistPath, uri, '..', filepath)] = true;

                });

            } else {
                repBuild = repSource;
            }

            return repBuild;
        });
    }
}
