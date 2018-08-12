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
                    "reps": {
                        "announcer": function /*CodeBlock */ () {

                            return {
                                tag: domplate.tags.UL(
                                    domplate.tags.FOR("item", "$list|listIterator", domplate.tags.LI("$item.value"))
                                ),
                                listIterator: function (items) {
                                    return items.map(function (value) {
                                        return {
                                            value: value
                                        };
                                    });
                                }
                            };
                        }
                    }
                }
            },
            "/": [
                '<head>',
                    '<script src="/reps/domplate-eval.js"></script>',
                '</head>',
                '<body><div></div></body>',
                '<script>',
                'window.domplate.loadRep("/reps/announcer", function (rep) {',
                    'rep.tag.replace({ list: [ "Item 1", "Item 2" ] }, document.querySelector("DIV"));',
                '}, console.error);',
                '</script>'
            ].join("\n")
        }
    });

    it('Test', function (client) {

        client.url('http://localhost:' + process.env.PORT + '/').pause(500);

        client.waitForElementPresent('BODY DIV[_dbid] UL', 5000);
        client.expect.element('BODY DIV').text.to.contain([
            'Item 1',
            'Item 2'
        ].join("\n"));

        if (process.env.BO_TEST_FLAG_DEV) client.pause(60 * 60 * 24 * 1000);
    });
});