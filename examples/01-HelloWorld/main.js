#!/usr/bin/env bash.origin.test via github.com/nightwatchjs/nightwatch
/*
module.config = {
    "browsers": [
        "chrome"
    ],
    "test_runner": "mocha"
}
*/

//console.log(">>>TEST_IGNORE_LINE:GET /dist/resources/insight.renderers.default/images/<<<");

console.log(">>>TEST_IGNORE_LINE:^[\\d\\.]+\\s<<<");

describe("Suite", function() {

    require('bash.origin.workspace').LIB.BASH_ORIGIN_EXPRESS.runForTestHooks(before, after, {
        "routes": {
            "/dist/domplate-eval.browser.js": {
                "@it.pinf.org.browserify#s1": {
                    "src": __dirname + "/../../lib/domplate-eval.js",
                    "dist": __dirname + "/../../dist/domplate-eval.browser.js",
                    "format": "browser",
                    "expose": {
                        "window": "domplate"
                    },
                    "prime": true
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
                "@it.pinf.org.browserify#s1": {
                    "src": __dirname + "/../../lib/domplate.js",
                    "dist": __dirname + "/../../dist/domplate.browser.js",
                    "format": "browser",
                    "expose": {
                        "window": "domplate"
                    },
                    "prime": true
                }
            },
            "^/reps/": {
                "@github.com~cadorn~domplate#s1": {
                    "compile": true,
                    "reps": {
                        "announcer1": {
                            struct: {
                                message: "Hello World"
                            },
                            rep: function /*CodeBlock */ () {

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

    it('Test', function (client) {

        client.url('http://localhost:' + process.env.PORT + '/eval').pause(500);
        
        var selector = 'BODY DIV DIV';

        client.waitForElementPresent(selector, 3000);

        client.expect.element(selector).text.to.contain([
            'Hello World!'
        ].join("\n"));

        client.url('http://localhost:' + process.env.PORT + '/no-eval').pause(500);

if (process.env.BO_TEST_FLAG_DEV) client.pause(60 * 60 * 24 * 1000);
        
        var selector = 'BODY DIV DIV';

        client.waitForElementPresent(selector, 3000);

        client.expect.element(selector).text.to.contain([
            'Hello World!'
        ].join("\n"));

    });
});
