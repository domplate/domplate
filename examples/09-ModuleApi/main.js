#!/usr/bin/env bash.origin.test via github.com/nightwatchjs/nightwatch
/*
module.config = {
    "browsers": [
        "chrome"
    ],
    "test_runner": "mocha"
}
*/

console.log(">>>TEST_IGNORE_LINE:Run tool step for:<<<");

const LIB = require('bash.origin.lib').js;

describe("Suite", function() {

    const server = LIB.BASH_ORIGIN_EXPRESS.runForTestHooks(before, after, {
        "routes": {
            "^/reps/": {
                "@domplate # router/v0": {
                    "compile": true,
                    "reps": {
                        "announcer1": __dirname + "/../05-CompiledRepCss/announcer1.rep.js"
                    }
                }
            },
            "/client.js": {
                "@it.pinf.org.browserify # router/v0": {
                    "src": "./client.js",
                    "format": "browser",
                    "expose": {
                        "window": "client"
                    }
                }
            },
            "/": [
                '<head>',
                    '<script src="/client.js"></script>',
                '</head>',
                '<body>',
                    '<div id="announcer1"></div>',
                '</body>',
                '<script>',
                    'window.client();',
                '</script>'
            ].join("\n")
        }
    });

    it('Test', async function (client) {

        const PORT = (await server).config.port;

        client.url('http://localhost:' + PORT + '/').pause(500);

if (process.env.BO_TEST_FLAG_DEV) client.pause(60 * 60 * 24 * 1000);
        
        client.waitForElementPresent('BODY #announcer1 > [__dbid]', 10 * 1000);

        client.expect.element('BODY DIV#announcer1').text.to.contain([
            'Hello World!'
        ].join(""));
        client.expect.element('BODY DIV#announcer1 > DIV').to.have.attribute('class').equals('announcer ');

    });
});
