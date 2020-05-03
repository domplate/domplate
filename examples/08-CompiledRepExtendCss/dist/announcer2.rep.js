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
      class: "announcer"
    }, "$message")
  };
}

function css() {
  return atob("Ci5hbm5vdW5jZXJbX19kYmlkPSIyNWFmZTJlMGUzMjY4NGVjNjVlYThjYWFjZjEyYzNiNTg3OTYzYjBkIl0gewogICAgYmFja2dyb3VuZC1jb2xvcjogcmVkOwp9CgoKLmFubm91bmNlcltfX2RiaWQ9IjI1YWZlMmUwZTMyNjg0ZWM2NWVhOGNhYWNmMTJjM2I1ODc5NjNiMGQiXSB7CiAgICBiYWNrZ3JvdW5kLWNvbG9yOiBncmVlbjsKICAgIGJvcmRlcjogMXB4IHNvbGlkIGJsYWNrOwogICAgcGFkZGluZzogNXB4Owp9Cg==");
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
return (function (__code__, __context__, __in__, __out__) {  with (this) {  with (__in__) {    __code__.push("","<div", " __dbid=\"","25afe2e0e32684ec65ea8caacf12c3b587963b0d", "\"", " __dtid=\"","announcer2", "\"", " class=\"","announcer", " ", "\"",">",__escape__(message),"</div>");  }}})
}
};
  rep.__dbid = "25afe2e0e32684ec65ea8caacf12c3b587963b0d";
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