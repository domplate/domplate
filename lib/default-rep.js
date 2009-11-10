
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };


var DefaultRep = function() {};

exports.rep = new DefaultRep();

exports.extend = function(obj) {
    var rep = function() {};
    rep.prototype = exports.rep;
    var rep = new rep();
    for (var n in obj) rep[n] = obj[n];
    return rep;
}

DefaultRep.prototype.toString = function()
{
    return "[default-rep]";
}

DefaultRep.prototype.setCollection = function(collection)
{
    this.collection = collection;
};

DefaultRep.prototype.getRepForObject = function(object, meta)
{
    if(!this.collection) {
        throw "No collection set for rep: " + this.toString();
    }
    
    return this.collection.getForObject(object, meta);
};


DefaultRep.prototype.isLeftClick = function(event)
{
    return event.button == 0 && this.noKeyModifiers(event);
};

DefaultRep.prototype.noKeyModifiers = function(event)
{
    return !event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey;
};

DefaultRep.prototype.getAncestorByClass = function(node, className)
{
    for (var parent = node; parent; parent = parent.parentNode)
    {
        if (this.hasClass(parent, className))
            return parent;
    }

    return null;
};

DefaultRep.prototype.setClass = function(node, name)
{
    if (node && !this.hasClass(node, name))
        node.className += " " + name;
};

DefaultRep.prototype.hasClass = function(node, name) // className, className, ...
{
    if (!node || node.nodeType != 1)
        return false;
    else
    {
        for (var i=1; i<arguments.length; ++i)
        {
            var name = arguments[i];
            var re = new RegExp("(^|\\s)"+name+"($|\\s)");
            if (!re.exec(node.getAttribute("class")))
                return false;
        }

        return true;
    }
};

DefaultRep.prototype.removeClass = function(node, name)
{
    if (node && node.className)
    {
        var index = node.className.indexOf(name);
        if (index >= 0)
        {
            var size = name.length;
            node.className = node.className.substr(0,index-1) + node.className.substr(index+size);
        }
    }
};

