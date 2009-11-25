
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };


var UTIL = require("util");
var FILE = require("file");

var CSS = function(packageId, path)
{
//    this.id = id;
    this.path = path;
    
    this.getPackageId = function() {
        return packageId;
    }

    this.getCode = function()
    {
        var code = [];

        code.push("/**");
//        code.push(" * id   = " + this.id);
        code.push(" * path = " + this.path);
        code.push(" */");
        code.push("\n");
            
        code.push(system.fs.read(this.path, {'charset': 'utf-8'}));
            
        return code.join("\n");
    }
    
    this.inject = function(document, callback) {

        var id = this.path;
        
        if(document.getElementById(id)) {
            // Stylesheet already added
            return;
        }

        var style = document.createElementNS("http://www.w3.org/1999/xhtml", "style");
        style.setAttribute("charset","utf-8");
        style.setAttribute("type", "text/css");
        style.setAttribute("id", id);
        style.innerHTML = (callback)?callback(this):this.getCode();

        var heads = document.getElementsByTagName("head");
        if (heads.length) {
            heads[0].appendChild(style);
        }
    }
}


var Collection = function()
{
    var reps = [];
    var css = [];
    var collections = [];
    
    this.addRep = function(rep)
    {
        if(rep.rep["setCollection"]) {
            rep.rep.setCollection(this);
        }
        reps.push(rep);
    }

    this.addCss = function(path, packageId)
    {
        css.push(new CSS(packageId, path));
    }
    
    this.addCollection = function(collection) {
        collections.push(collection);
    }
    
    this.getCss = function()
    {
        var list = [];
        collections.forEach(function(collection) {
            list = list.concat(collection.getCss());
        });
        return list.concat(css);
    }

    this.injectCss = function(document, callback) {
        css.forEach(function(item) {
            item.inject(document, callback);
        });
        collections.forEach(function(collection) {
            collection.injectCss(document, callback);
        });
    }
/*
    this.getForObject = function(object, meta)
    {
        var type = typeof(object);
        meta = meta || {};
        
        for( var i=0 ; i<reps.length ; i++ ) {
            try {
                if(reps[i].rep.supportsObject(object, type, meta)) {
                    return reps[i].rep;
                }
            } catch(e) {
                print(e,' ERROR');
            }        
        }
        
        var found = false;
        collections.forEach(function(collection) {
            if(found) return;
            found = collection.getForObject(object, meta);
        });
        return found;
    }
*/    
    this.getForNode = function(node)
    {
        for( var i=0 ; i<reps.length ; i++ ) {
            try {
                if(reps[i].rep.supportsNode(node)) {
                    return reps[i].rep;
                }
            } catch(e) {
                print(e,' ERROR');
            }        
        }
        
        var found = false;
        collections.forEach(function(collection) {
            if(found) return;
            found = collection.getForNode(node);
        });
        return found;
    }    
}

exports.Collection = function()
{
    return new Collection();
}