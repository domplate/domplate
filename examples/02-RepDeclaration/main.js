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
console.log(">>>TEST_IGNORE_LINE:Writing to:<<<");

const LIB = require('bash.origin.lib').js;

describe("Suite", function() {

    this.timeout(60 * 60 * 24 * 1000);

    const server = LIB.BASH_ORIGIN_EXPRESS.runForTestHooks(before, after, {
        "routes": {
            "^/reps/": {
                "gi0.PINF.it/build/v0 # /.dist # /reps": {
                    "@domplate # router/v1": {
                        "reps": {
                            "announcer": function /* CodeBlock */ () {

                                return {
                                    tag: domplate.tags.DIV("$message")
                                };
                            }
                        }
                    }
                }
            },
            "/": [
                '<script src="/reps/dist/domplate-eval.browser.js"></script>',
                '<div></div>',
                '<script>',
                    'window.domplate.loadRep("/reps/reps/announcer", function (rep) {',
                        'rep.tag.replace({ message: "Hello World!" }, document.querySelector("DIV"));',
                    '}, console.error);',
                '</script>'
            ].join("\n")
        }
    });

    it('Test', async function (client) {

        const PORT = (await server).config.port;

        client.url('http://localhost:' + PORT + '/').pause(500);

if (process.env.BO_TEST_FLAG_DEV) client.pause(60 * 60 * 24 * 1000);
        
        var selector = 'BODY DIV DIV';

        client.waitForElementPresent(selector, 10 * 1000);

        client.expect.element(selector).text.to.contain([
            'Hello World!'
        ].join("\n"));
    });
});
