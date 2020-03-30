#!/usr/bin/env bash.origin.test via github.com/nightwatchjs/nightwatch
/*
module.config = {
    "browsers": [
        "chrome"
    ],
    "test_runner": "mocha"
}
*/

const LIB = require('bash.origin.lib').js;

describe("Suite", function() {

//    this.timeout(60 * 60 * 24 * 1000);

    const server = LIB.BASH_ORIGIN_EXPRESS.runForTestHooks(before, after, {
        "routes": {
            "/dist/domplate-eval.browser.js": {
                "@it.pinf.org.browserify # router/v0": {
                    "src": __dirname + "/../../lib/domplate-eval.js",
                    "format": "browser",
                    "expose": {
                        "window": "domplate"
                    },
                    "strictMode": false
                }
            },
            "/eval": [
                '<script src="/dist/domplate-eval.browser.js"></script>',
                '<div></div>',
                '<script>',
                'var rep = window.domplate.domplate({',
                '    tag: window.domplate.tags.DIV("$message")',
                '});',
                'rep.tag.replace({',
                '    message: "Hello World!"',
                '}, document.querySelector("DIV"));',
                '</script>'
            ].join("\n"),
            "/dist/domplate.browser.js": {
                "@it.pinf.org.browserify # router/v0": {
                    "src": __dirname + "/../../lib/domplate.js",
                    "format": "browser",
                    "expose": {
                        "window": "domplate"
                    },
                    "strictMode": false
                }
            },
            "^/reps/": {
                "@domplate # router/v0": {
                    "compile": true,
                    "reps": {
                        "announcer1": {
                            struct: {
                                message: "Hello World"
                            },
                            rep: function CodeBlock /*CodeBlock*/ () {

                                return {
                                    tag: domplate.tags.DIV("$message")
                                };
                            }
                        },
                    }
                }
            },
            "/no-eval": [
                '<script src="/dist/domplate.browser.js"></script>',
                '<div></div>',
                '<script>',
                    'window.domplate.loadRep("/reps/announcer1", function (rep) {',
                        'rep.tag.replace({ message: "Hello World!" }, document.querySelector("DIV"));',
                    '}, console.error);',
                '</script>'
            ].join("\n")
        }
    });

    it('Test', async function (client) {

        const PORT = (await server).config.port;

        client.url('http://localhost:' + PORT + '/eval').pause(500);
        
        var selector = 'BODY DIV DIV';

        client.waitForElementPresent(selector, 10 * 1000);

        client.expect.element(selector).text.to.contain([
            'Hello World!'
        ].join("\n"));

        client.url('http://localhost:' + PORT + '/no-eval').pause(500);

if (process.env.BO_TEST_FLAG_DEV) client.pause(60 * 60 * 24 * 1000);

        var selector = 'BODY DIV DIV';

        client.waitForElementPresent(selector, 10 * 1000);

        client.expect.element(selector).text.to.contain([
            'Hello World!'
        ].join("\n"));

    });
});
