PINF.bundle("", function(__require) {
	__require.memoize("/main.js", function (_require, _exports, _module) {
var bundle = { require: _require, exports: _exports, module: _module };
var exports = undefined;
var module = undefined;
var define = function (deps, init) {
_module.exports = init();
}; define.amd = true;
       var pmodule = bundle.module;

(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.mainModule = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){


function impl(domplate) {
  return {
    tag: domplate.tags.DIV({
      style: "border: 1px solid black; padding: 5px;",
      class: "announcer"
    }, domplate.tags.DIV("$message"), domplate.tags.DIV({
      class: "img"
    }))
  };
}

function css() {
  return atob("Ci5hbm5vdW5jZXJbX19kYmlkPSJlNjUxNWE3NjJlMzBhMWUzOTY3OTM0NTljMjk0N2M3OWMyNjljMGYwIl0gewogICAgYmFja2dyb3VuZC1jb2xvcjogZ3JlZW47CiAgICB3aGl0ZS1zcGFjZTogbm93cmFwOwp9CgouYW5ub3VuY2VyW19fZGJpZD0iZTY1MTVhNzYyZTMwYTFlMzk2NzkzNDU5YzI5NDdjNzljMjY5YzBmMCJdID4gRElWIHsKICAgIGRpc3BsYXk6IGlubGluZS1ibG9jazsKfQoKLmFubm91bmNlcltfX2RiaWQ9ImU2NTE1YTc2MmUzMGExZTM5Njc5MzQ1OWMyOTQ3Yzc5YzI2OWMwZjAiXSA+IERJVi5pbWcgewogICAgYmFja2dyb3VuZC1pbWFnZTogdXJsKGltYWdlcy9pbmZvcm1hdGlvbi5wbmcpOwogICAgd2lkdGg6IDE2cHg7CiAgICBoZWlnaHQ6IDE2cHg7CiAgICBtYXJnaW4tbGVmdDogMTBweDsKfQo=");
}

exports.main = function (domplate, options) {
  options = options || {};
  var rep = impl(domplate);
  rep.__dom = {
"tag":function (context) {
var DomplateDebug = context.DomplateDebug;
var __path__ = context.__path__;
var __bind__ = context.__bind__;
var __if__ = context.__if__;
var __link__ = context.__link__;
var __loop__ = context.__loop__;
return (function (root, context, o) {  with (this) {  }  return 1;})
}
};
  rep.__markup = {
"tag":function (context) {
var DomplateDebug = context.DomplateDebug;
var __escape__ = context.__escape__;
var __if__ = context.__if__;
var __loop__ = context.__loop__;
var __link__ = context.__link__;
return (function (__code__, __context__, __in__, __out__) {  with (this) {  with (__in__) {    __code__.push("","<div", " style=\"","border: 1px solid black; padding: 5px;", "\"", " __dbid=\"","e6515a762e30a1e396793459c2947c79c269c0f0", "\"", " __dtid=\"","announcer2", "\"", " class=\"","announcer", " ", "\"",">","<div",">",__escape__(message),"</div>","<div", " class=\"","img", " ", "\"",">","</div>","</div>");  }}})
}
};
  rep.__dbid = "e6515a762e30a1e396793459c2947c79c269c0f0";
  rep.__dtid = "announcer2";
  var res = domplate.domplate(rep);
  var injectedCss = false;

  rep.__ensureCssInjected = function () {
    if (injectedCss) return;
    injectedCss = true;
    var node = document.createElement("style");
    var cssCode = css();

    if (cssCode) {
      if (options.cssBaseUrl) {
        cssCode = cssCode.replace(/(url\s*\()([^\)]+\))/g, "$1" + options.cssBaseUrl + "$2");
      }

      node.innerHTML = cssCode;
      document.body.appendChild(node);
    }
  };

  Object.keys(rep).forEach(function (tagName) {
    if (!rep[tagName].tag) return;
    var replace_orig = res[tagName].replace;

    res[tagName].replace = function () {
      var res = replace_orig.apply(this, arguments);
      if (!res) return;
      setTimeout(function () {
        rep.__ensureCssInjected();
      }, 0);
      return res;
    };
  });
  return res;
};
},{}]},{},[1])(1)
});

	});
});