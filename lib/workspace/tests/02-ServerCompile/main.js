#!/usr/bin/env bash.origin.test via github.com/nightwatchjs/nightwatch
/*
module.config = {
    "browsers": [
        "chrome"
    ],
    "test_runner": "mocha"
}
*/

describe("Suite", function() {
    
    const ASSERT = require("assert");
    const CODEBLOCK = require(process.env.DOMPLATE_REP_WORKSPACE__CODEBLOCK_PATH);

    var repCode = JSON.parse(CODEBLOCK.requireJSON(process.env.DOMPLATE_REP_WORKSPACE__REP_PATH));

    require(process.env.DOMPLATE_REP_WORKSPACE__BASH_ORIGIN_LIB_PATH).js.BASH_ORIGIN_EXPRESS.runForTestHooks(before, after, {
        "routes": {
            "^/reps/": {
                "@github.com~cadorn~domplate#s1": {
                    "compile": true,
                    "reps": {
                        "rep": process.env.DOMPLATE_REP_WORKSPACE__REP_PATH
                    }
                }
            },
            "/": [
                '<head>',
                    '<script src="/reps/domplate-eval.js"></script>',
                '</head>',
                '<body><div></div></body>',
                '<script>',
                'window.domplate.loadRep("/reps/rep", function (rep) {',
                    'rep.tag.replace(' + JSON.stringify(repCode.struct) + ', document.querySelector("DIV"));',
                '}, console.error);',
                '</script>'
            ].join("\n")
        }
    });

    it('Test', function (client) {

        client.url('http://localhost:' + process.env.PORT + '/').pause(500);

        if (process.env.BO_TEST_FLAG_DEV) client.pause(60 * 60 * 24 * 1000);

        client.waitForElementPresent('BODY DIV[_dbid]', 5000);

        client.execute(function(selector) {
            return document.querySelector(selector).innerHTML;
        }, ['BODY DIV[_dbid]'], function (result) {

            console.log("ACTUAL INNER HTML:", result.value);
            
            var expected = CODEBLOCK.thawFromJSON(repCode.tests["02"].result).getCode().trim();

            console.log("EXPECTED INNER HTML:", expected);

            ASSERT.equal(
                result.value,
                expected
            );            
        });
        
    });
});