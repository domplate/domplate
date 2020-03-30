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

    const server = LIB.BASH_ORIGIN_EXPRESS.runForTestHooks(before, after, {
        "routes": {
            "^/reps/": {
                "@domplate # router/v0": {
                    "compile": true,
                    "reps": {
                        "announcer1": __dirname + "/announcer1.rep.js",
                        "announcer2": __dirname + "/announcer2.rep.js"
                    }
                }
            },
            "/": [
                '<head>',
                    '<script src="/reps/domplate.browser.js"></script>',
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
        client.getCssProperty('BODY DIV#announcer1 > DIV', "background-color", function (result) {
            this.assert.equal(result.value, 'rgba(255, 0, 0, 1)');
        });

        client.waitForElementPresent('BODY #announcer2 > [__dbid]', 10 * 1000);
        client.expect.element('BODY DIV#announcer2').text.to.contain([
            'Hello World!'
        ].join(""));
        client.expect.element('BODY DIV#announcer2 > DIV').to.have.attribute('class').equals('announcer ');
        client.getCssProperty('BODY DIV#announcer2 > DIV', "background-color", function (result) {
            this.assert.equal(result.value, 'rgba(0, 255, 255, 1)');
        });

        if (process.env.BO_TEST_FLAG_DEV) client.pause(60 * 60 * 24 * 1000);
    });
});
