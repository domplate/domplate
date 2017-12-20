

var ASSERT = require("assert");

var DOMPLATE = require("../lib/domplate");

    
var rep;

with (DOMPLATE.tags) {
    rep = DOMPLATE.domplate({
        tag: DIV({"style": "color: red;"},"$object|capitalize"),
        capitalize: function(str) {
            return str.toUpperCase();
        }
    });
}    

var html = rep.tag.render({
    object: "Hello World"
});

ASSERT.equal("<div style=\"color: red;\" class=\" \">HELLO WORLD</div>", html);

console.log("OK");
