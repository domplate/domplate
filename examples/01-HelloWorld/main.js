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
            "/dist/domplate-eval.js": {
                "@it.pinf.org.browserify#s1": {
                    "src": __dirname + "/../../lib/domplate-eval.js",
                    "dist": __dirname + "/../../dist/domplate-eval.js",
                    "format": "standalone",
                    "expose": {
                        "window": "domplate"
                    },
                    "prime": true
                }
            },
            "/": [
                '<script src="/dist/domplate-eval.js"></script>',
                '<div></div>',
                '<script>',
                'var rep = window.domplate.domplate({',
                '    tag: window.domplate.tags.DIV("$message")',
                '});',
                'rep.tag.replace({',
                '    message: "Hello World!"',
                '}, document.querySelector("DIV"));',
                '</script>'
            ].join("\n")
        }
    });

    it('Test', function (client) {

        client.url('http://localhost:' + process.env.PORT + '/').pause(500);
        
        var selector = 'BODY DIV DIV';

        client.waitForElementPresent(selector, 3000);

        client.expect.element(selector).text.to.contain([
            'Hello World!'
        ].join("\n"));

        if (process.env.BO_TEST_FLAG_DEV) client.pause(60 * 60 * 24 * 1000);

    });
});
