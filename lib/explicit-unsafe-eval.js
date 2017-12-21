
exports.compileMarkup = function (code, context) {
    var DomplateDebug = context.DomplateDebug;
    var __escape__ = context.__escape__;
    var __if__ = context.__if__;
    var __loop__ = context.__loop__;
    var __link__ = context.__link__;

//console.error("[explicit-unsafe-eval] compileMarkup", code);

    return eval(code);
};

exports.compileDOM = function (code, context) {
    var DomplateDebug = context.DomplateDebug;
    var __path__ = context.__path__;
    var __bind__ = context.__bind__;
    var __if__ = context.__if__;
    var __link__ = context.__link__;
    var __loop__ = context.__loop__;

//console.error("[explicit-unsafe-eval] compileDOM", code);
    
    return eval(code);
};
