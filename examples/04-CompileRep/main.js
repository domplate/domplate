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

    require('bash.origin.workspace').LIB.BASH_ORIGIN_EXPRESS.runForTestHooks(before, after, {
        "routes": {
            "^/reps/": {
                "@github.com~cadorn~domplate#s1": {
                    "dist": __dirname + "/../../dist",
                    "compile": true,
                    "reps": {
                        "announcer1": {
                            dist: false,
                            struct: {
                                message: "Hello World"
                            },
                            rep: function /*CodeBlock */ () {

                                return {
                                    tag: domplate.tags.DIV("$message|capitalize"),
                                    capitalize: function (message) {
                                        return message.toUpperCase();
                                    }
                                };
                            }
                        },
                        "announcer2": {
                            dist: false,
                            structs: {
                                tag: {
                                    message1: "Hello World: 1",
                                    message2: "Hello World: 2"
                                },
                                messageTag: {
                                    message: "Hello World: 0",
                                }
                            },
                            rep: function /*CodeBlock */ () {

                                return {
                                    tag: domplate.tags.DIV(
                                        {
                                            style: "border: 1px solid black; padding: 5px"
                                        },
                                        domplate.tags.TAG("$messageTag", { "message": "$message1" }),
                                        domplate.tags.TAG("$message2|getTag", { "message": "$message2" })
                                    ),

                                    messageTag: domplate.tags.DIV({
                                        "class": "messageTagClass"
                                    }, "$message"),

                                    getTag: function () {
                                        return this.messageTag;
                                    }
                                };
                            }
                        }
                    }
                }
            },
            "/": [
                '<head>',
                    '<script src="/reps/domplate.js"></script>',
                '</head>',
                '<body>',
                    '<div id="announcer1"></div>',
                    '<div id="announcer2"></div>',
                '</body>',
                '<script>',
                    'window.domplate.loadRep("/reps/announcer1", function (rep) {',
                        'rep.tag.replace({ message: "Hello World! (0)" }, document.querySelector("DIV#announcer1"));',
                    '}, console.error);',
                    'window.domplate.loadRep("/reps/announcer2", function (rep) {',
                        'rep.tag.replace({ message1: "Hello World! (1)", message2: "Hello World! (2)" }, document.querySelector("DIV#announcer2"));',
                    '}, console.error);',
                '</script>'
            ].join("\n")
        }
    });

    it('Test', function (client) {

        client.url('http://localhost:' + process.env.PORT + '/').pause(500);
        
        client.waitForElementPresent('BODY DIV[_dbid]#announcer1', 3000);
        client.expect.element('BODY DIV#announcer1').text.to.contain([
            'HELLO WORLD! (0)'
        ].join(""));

        client.waitForElementPresent('BODY DIV[_dbid]#announcer2', 3000);
        client.expect.element('BODY DIV#announcer2').text.to.contain([
            'Hello World! (1)',
            'Hello World! (2)'
        ].join("\n"));

        if (process.env.BO_TEST_FLAG_DEV) client.pause(60 * 60 * 24 * 1000);
    });
});
