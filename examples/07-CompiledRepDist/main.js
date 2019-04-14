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
                    "dist": __dirname + "/dist",
                    "compile": true,
                    "reps": {
                        "announcer1": {
                            dist: true,
                            struct: {
                                message: "Hello World"
                            },
                            rep: function CodeBlock /*CodeBlock */ () {

                                return {
                                    tag: domplate.tags.DIV("$message")
                                };
                            }
                        },
                        "announcer2": __dirname + "/reps/announcer2.rep.js"
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
                    'window.domplate.loadRep("/reps/announcer2", { cssBaseUrl: "/reps/subdir/" }, function (rep) {',
                        'rep.tag.replace({ message: "Hello World!" }, document.querySelector("DIV#announcer2"));',
                    '}, console.error);',
                '</script>'
            ].join("\n")
        }
    });

    it('Test', function (client) {

        client.url('http://localhost:' + process.env.PORT + '/').pause(500);
        
        client.waitForElementPresent('BODY #announcer1 > [__dbid]', 3000);
        client.expect.element('BODY DIV#announcer1').text.to.contain([
            'Hello World!'
        ].join(""));

        client.waitForElementPresent('BODY #announcer2 > [__dbid]', 3000);
        client.expect.element('BODY DIV#announcer2').text.to.contain([
            'Hello World!'
        ].join(""));

        if (process.env.BO_TEST_FLAG_DEV) client.pause(60 * 60 * 24 * 1000);
    });
});
