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
console.log(">>>TEST_IGNORE_LINE:\"GET \\/<<<");
console.log(">>>TEST_IGNORE_LINE:\\[pinf.it\\].+Writing to:<<<");

const LIB = require('bash.origin.lib').js;

describe("Suite", function() {

    this.timeout(60 * 60 * 1000);

    const server = LIB.BASH_ORIGIN_EXPRESS.runForTestHooks(before, after, {
        "routes": {
            "^/reps/": {
                "gi0.PINF.it/build/v0 # /dist # /": {
                    "@domplate # router/v1": {
                        "compile": true,
                        "reps": {
                            "announcer1": {
                                dist: true,
                                struct: {
                                    message: "Hello World"
                                },
                                rep: function /*CodeBlock*/ () {

                                    return {
                                        tag: domplate.tags.DIV("$message")
                                    };
                                }
                            },
                            "announcer2": __dirname + "/reps/announcer2.rep.js"
                        }
                    }
                }
            },
            "^/reps2/": {
                "gi0.PINF.it/build/v0 # /dist # /": {
                    "@domplate # router/v1": {
                        "externalizeCss": true,
                        "compile": true,
                        "reps": {
                            "announcer3": __dirname + "/reps/announcer3.rep.js"
                        }
                    }
                }
            },
            "/": [
                '<head>',
                    '<script src="/reps/dist/domplate.browser.js"></script>',
                '</head>',
                '<body>',
                    '<div id="announcer1"></div>',
                    '<div id="announcer2"></div>',
                    '<div id="announcer3"></div>',
                '</body>',
                '<script>',
                    'window.domplate.loadRep("/reps/announcer1", function (rep) {',
                        'rep.tag.replace({ message: "Hello World!" }, document.querySelector("DIV#announcer1"));',
                    '}, console.error);',
                    'window.domplate.loadRep("/reps/announcer2", { cssBaseUrl: "/reps/" }, function (rep) {',
                        'rep.tag.replace({ message: "Hello World!" }, document.querySelector("DIV#announcer2"));',
                    '}, console.error);',
                    'window.domplate.loadRep("/reps2/announcer3", { cssBaseUrl: "/reps2/" }, function (rep) {',
                        'rep.tag.replace({ message: "Hello World!" }, document.querySelector("DIV#announcer3"));',
                    '}, console.error);',
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

        client.waitForElementPresent('BODY #announcer2 > [__dbid]', 10 * 1000);
        client.expect.element('BODY DIV#announcer2').text.to.contain([
            'Hello World!'
        ].join(""));

        client.waitForElementPresent('BODY #announcer3 > [__dbid]', 10 * 1000);
        client.expect.element('BODY DIV#announcer3').text.to.contain([
            'Hello World!'
        ].join(""));

        if (process.env.BO_TEST_FLAG_DEV) client.pause(60 * 60 * 24 * 1000);
    });
});
