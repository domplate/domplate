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
console.log(">>>TEST_IGNORE_LINE:\"GET \\/<<<");

const LIB = require('bash.origin.lib').js;

describe("Suite", function() {

    const server = LIB.BASH_ORIGIN_EXPRESS.runForTestHooks(before, after, {
        "routes": {
            "^/reps/": {
                "gi0.PINF.it/build/v0 # /.dist # /": {
                    "@domplate # router/v1": {
                        "compile": true,
                        "reps": {
                            "announcer1": __dirname + "/announcer1.rep.js",
                            "announcer2": __dirname + "/announcer2.rep.js"
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
                '</body>',
                '<script>',
                    'window.domplate.loadRep("/reps/announcer1", function (rep) {',
                        'rep.tag.replace({ message: "Hello World!" }, document.querySelector("DIV#announcer1"));',
                    '}, console.error);',
                    'window.domplate.loadRep("/reps/announcer2", function (rep) {',
                        'rep.tag.replace({ message: "Hello World!" }, document.querySelector("DIV#announcer2"));',
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
        client.expect.element('BODY DIV#announcer1 > DIV').to.have.attribute('class').equals('announcer ');        
        
        client.waitForElementPresent('BODY #announcer2 > [__dbid]', 10 * 1000);
        client.expect.element('BODY DIV#announcer2').text.to.contain([
            'Hello World!'
        ].join(""));
        client.expect.element('BODY DIV#announcer2 > DIV').to.have.attribute('class').equals('announcer ');
        client.expect.element('BODY DIV#announcer2 > DIV').to.have.attribute('style').equals("border: 1px solid black; padding: 5px;");
        
        if (process.env.BO_TEST_FLAG_DEV) client.pause(60 * 60 * 24 * 1000);
    });
});
