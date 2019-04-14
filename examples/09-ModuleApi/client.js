
var DOMPLATE = require("../../dist/domplate.js");

exports.client = function () {

    DOMPLATE.domplate.loadRep("/reps/announcer1", function (rep) {
        rep.tag.replace(
            {
                message: "Hello World!"
            },
            document.querySelector("DIV#announcer1")
        );
    }, console.error);
}
