#!/usr/bin/env bash.origin.test via github.com/nightwatchjs/nightwatch
/*
module.config = {
    "browsers": [
        "chrome"
    ],
    "test_runner": "mocha"
}
*/

console.log(">>>TEST_IGNORE_LINE:^[\\d\\.]+\\s<<<");

describe("Suite", function() {

    require('bash.origin.lib').js.BASH_ORIGIN_EXPRESS.runForTestHooks(before, after, {
        "routes": {
            "^/reps/": {
                "@github.com~cadorn~domplate#s1": {
                    "compile": true,
                    "reps": {
                        "announcer1": __dirname + "/../05-CompiledRepCss/announcer1.rep.js"
                    }
                }
            },
            "/client.js": {
                "@it.pinf.org.browserify#s1": {
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

    it('Test', function (client) {

        client.url('http://localhost:' + process.env.PORT + '/').pause(500);

if (process.env.BO_TEST_FLAG_DEV) client.pause(60 * 60 * 24 * 1000);
        
        client.waitForElementPresent('BODY #announcer1 > [__dbid]', 5000);

        client.expect.element('BODY DIV#announcer1').text.to.contain([
            'Hello World!'
        ].join(""));
        client.expect.element('BODY DIV#announcer1 > DIV').to.have.attribute('class').equals('announcer ');

    });
});
